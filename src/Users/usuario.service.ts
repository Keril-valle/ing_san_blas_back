import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { RegisterDto } from '../Auth/DTO/register.dto';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { UsuarioRespuestaDto } from './DTO/usuario-respuesta.dto';
import { Role } from '../Common/Enums/Roles';
import { Usuario } from './Entities/usuario.entity';
import { RolService } from './rol.service';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// whitelist de columnas ordenables: mapea el param del DTO a la propiedad real de la entidad.
// nunca se concatena un string del cliente dentro de orderBy (evita inyección SQL)
const COLUMNAS_ORDEN_USUARIO = {
  nombre: 'usuario.nombre',
  email: 'usuario.email',
  telefono: 'usuario.telefono',
  role: 'usuario.role',
  state: 'usuario.isActive',
  createdAt: 'usuario.createdAt',
} as const;

type ColumnaOrdenUsuario = keyof typeof COLUMNAS_ORDEN_USUARIO;

// tope de la caché de consultas a GoMeta: sin límite crecería sin control
const LIMITE_CACHE_CEDULAS = 5_000;

@Injectable()
export class UsuarioService {
  private readonly cedulasCache = new Map<
    string,
    { nombre: string | null; venceEn: number }
  >();
  private readonly consultasCedula = new Map<string, Promise<string | null>>();

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly rolService: RolService,
  ) {}

  async createUser(registerDto: RegisterDto | CreateUsuarioDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existingUser = await this.usuarioRepository.findOneBy({
      email: ILike(registerDto.email),
      isActive: true,
    });
    if (existingUser) {
      throw new ConflictException('El ingresado email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const rolesSolicitados = this.rolesSolicitadosDe(registerDto);
    const roles = await this.rolService.assertExisten(rolesSolicitados);
    const telefono =
      'telefono' in registerDto && typeof registerDto.telefono === 'string'
        ? registerDto.telefono
        : null;
    const user = this.usuarioRepository.create({
      nombre: registerDto.nombre,
      email: registerDto.email,
      password: hashedPassword,
      role: roles[0].clave,
      telefono,
    });

    const saved = await this.usuarioRepository.save(user);
    await this.reemplazarRolesUsuario(
      saved.id,
      roles.map((rol) => rol.id),
    );
    return this.sinSecretos({
      ...saved,
      roles: roles.map((rol) => rol.clave),
    });
  }

  // La contraseña y el hash del refresh token jamás deben salir en una
  // respuesta (UsuarioRespuestaDto hace lo mismo, pero renombrando campos).
  private sinSecretos<T extends object>(usuario: T): T {
    const copia = { ...usuario };
    delete (copia as Record<string, unknown>).password;
    delete (copia as Record<string, unknown>).refreshTokenHash;
    return copia;
  }

  async obtenerRolesDeUsuario(id: number): Promise<string[]> {
    const rows = await this.usuarioRepository.manager.query<
      Array<{ clave: string }>
    >(
      'SELECT r.clave FROM usuario_roles ur JOIN rol r ON r.id = ur.rol_id WHERE ur.usuario_id = $1 ORDER BY r.id ASC',
      [id],
    );
    return rows.map((row) => row.clave);
  }

  private async conRoles(
    usuarios: Usuario[],
  ): Promise<Array<Usuario & { roles: string[] }>> {
    if (usuarios.length === 0) return [];

    // una sola consulta para toda la página (antes: una consulta por usuario)
    const filas = await this.usuarioRepository.manager.query<
      Array<{ usuarioId: number; clave: string }>
    >(
      `SELECT ur.usuario_id AS "usuarioId", r.clave
         FROM usuario_roles ur
         JOIN rol r ON r.id = ur.rol_id
        WHERE ur.usuario_id = ANY($1::int[])
        ORDER BY ur.usuario_id ASC, r.id ASC`,
      [usuarios.map((usuario) => usuario.id)],
    );

    const porUsuario = new Map<number, string[]>();
    for (const fila of filas) {
      const claves = porUsuario.get(fila.usuarioId) ?? [];
      claves.push(fila.clave);
      porUsuario.set(fila.usuarioId, claves);
    }

    return usuarios.map((usuario) => ({
      ...usuario,
      roles: porUsuario.get(usuario.id) ?? [],
    }));
  }

  private rolesSolicitadosDe(dto: RegisterDto | CreateUsuarioDto): string[] {
    if ('roles' in dto && Array.isArray(dto.roles) && dto.roles.length > 0) {
      const limpias = [
        ...new Set(dto.roles.map((rol) => rol.trim()).filter(Boolean)),
      ];
      if (limpias.length > 0) return limpias;
    }
    return [Role.USER];
  }

  private async reemplazarRolesUsuario(
    usuarioId: number,
    rolIds: number[],
  ): Promise<void> {
    await this.usuarioRepository.manager.query(
      'DELETE FROM usuario_roles WHERE usuario_id = $1',
      [usuarioId],
    );
    const unicos = [...new Set(rolIds)];
    if (unicos.length === 0) return;
    // un solo INSERT para todos los roles (antes: uno por rol)
    await this.usuarioRepository.manager.query(
      'INSERT INTO usuario_roles (usuario_id, rol_id) SELECT $1::int, t FROM unnest($2::int[]) AS t',
      [usuarioId, unicos],
    );
  }

  findAll() {
    return this.usuarioRepository
      .find({ where: { isActive: true } })
      .then(async (usuarios) =>
        plainToInstance(UsuarioRespuestaDto, await this.conRoles(usuarios)),
      );
  }

  // paginación server-side: busca por nombre/email/teléfono con ILike y devuelve
  // data + total + pages para que el frontend controle la paginación sin cargar todo
  async findAllPaginado(
    page = 1,
    limit = 10,
    search?: string,
    role?: string,
    state?: string,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc',
  ) {
    const pagina = Math.max(1, Math.floor(Number(page)) || 1);
    const limite = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10));
    const texto = search?.trim();
    const rolFiltro = role?.trim();
    const estadoFiltro = state?.trim();

    // orden por columna elegida por el usuario, con fallback al orden por defecto.
    // el id de desempate evita que al paginar se repitan o salten filas con el mismo valor
    const columnaOrden =
      COLUMNAS_ORDEN_USUARIO[sortBy as ColumnaOrdenUsuario] ??
      'usuario.createdAt';
    const direccionOrden = sortDirection === 'asc' ? 'ASC' : 'DESC';

    const qb = this.usuarioRepository
      .createQueryBuilder('usuario')
      .orderBy(columnaOrden, direccionOrden)
      .addOrderBy('usuario.id', 'DESC')
      .take(limite)
      .skip((pagina - 1) * limite);

    if (rolFiltro) {
      qb.andWhere('usuario.role = :role', { role: rolFiltro });
    }

    if (estadoFiltro === 'active') {
      qb.andWhere('usuario.isActive = :isActive', { isActive: true });
    } else if (estadoFiltro === 'inactive') {
      qb.andWhere('usuario.isActive = :isActive', { isActive: false });
    } else {
      qb.andWhere('usuario.isActive = :isActive', { isActive: true });
    }

    if (texto) {
      qb.andWhere(
        '(LOWER(usuario.nombre) LIKE LOWER(:texto) OR LOWER(usuario.email) LIKE LOWER(:texto) OR LOWER(usuario.telefono) LIKE LOWER(:texto))',
        { texto: `%${texto}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: plainToInstance(UsuarioRespuestaDto, await this.conRoles(data)),
      total,
      page: pagina,
      pages: Math.ceil(total / limite),
      limit: limite,
    };
  }

  async findOne(id: number) {
    const user = await this.usuarioRepository.findOneBy({ id, isActive: true });
    if (!user) return null;
    const [conRol] = await this.conRoles([user]);
    return plainToInstance(UsuarioRespuestaDto, conRol);
  }

  findOneByEmail(email: string) {
    return this.usuarioRepository.findOneBy({ email, isActive: true });
  }

  findActivoParaRecuperacion(email: string) {
    return this.usuarioRepository.findOne({
      where: { email: ILike(email.trim()), isActive: true },
      select: { id: true, email: true, nombre: true },
    });
  }

  async credencialesVigentes(
    id: number,
    emitidoEnSegundos?: number,
  ): Promise<boolean> {
    const user = await this.usuarioRepository.findOne({
      where: { id, isActive: true },
      select: { id: true, passwordChangedAt: true },
    });
    if (!user) return false;
    if (!user.passwordChangedAt) return true;
    if (emitidoEnSegundos == null) return false;
    return emitidoEnSegundos * 1000 >= user.passwordChangedAt.getTime() - 1000;
  }

  async estaActivo(id: number): Promise<boolean> {
    const user = await this.usuarioRepository.findOneBy({ id, isActive: true });
    return user != null;
  }

  findByEmailWithPassword(email: string) {
    return this.usuarioRepository.findOne({
      where: { email, isActive: true },
      select: {
        id: true,
        nombre: true,
        email: true,
        password: true,
        role: true,
      },
    });
  }

  async findByIdWithRefreshToken(id: number) {
    const rows = await this.usuarioRepository.manager.query<Usuario[]>(
      'SELECT id, email, role, "refreshTokenHash" FROM usuario WHERE id = $1 AND "isActive" = true',
      [id],
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async setRefreshTokenHash(id: number, hash: string | null) {
    await this.usuarioRepository.manager.query(
      'UPDATE usuario SET "refreshTokenHash" = $1 WHERE id = $2',
      [hash, id],
    );
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
    actorId?: number,
  ) {
    const user = await this.usuarioRepository.findOneBy({ id, isActive: true });

    if (!user) {
      throw new NotFoundException(`El usuario con el id ${id} no existe`);
    }

    const esMismoUsuario = actorId != null && id === actorId;

    if (esMismoUsuario) {
      if (
        updateUsuarioDto.role !== undefined &&
        updateUsuarioDto.role !== user.role
      ) {
        throw new BadRequestException('No puede cambiar su propio rol.');
      }
      if (updateUsuarioDto.roles !== undefined) {
        throw new BadRequestException('No puede cambiar sus propios roles.');
      }
      if (updateUsuarioDto.isActive === false) {
        throw new BadRequestException('No puede inactivar su propia cuenta.');
      }
    }

    if (updateUsuarioDto.password !== undefined) {
      if (updateUsuarioDto.confirmPassword !== updateUsuarioDto.password) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }
      user.password = await bcrypt.hash(updateUsuarioDto.password, 12);
      // al reestablecer la contraseña de OTRO usuario, los JWT emitidos antes
      // dejan de servir (credencialesVigentes los rechaza). Si se cambia la
      // propia no se toca, para no cerrarle la sesión al que acaba de hacerlo.
      if (!esMismoUsuario) {
        user.passwordChangedAt = new Date();
      }
    }

    if (updateUsuarioDto.nombre !== undefined) {
      user.nombre = updateUsuarioDto.nombre;
    }

    if (updateUsuarioDto.telefono !== undefined) {
      user.telefono = updateUsuarioDto.telefono;
    }

    if (!esMismoUsuario) {
      if (updateUsuarioDto.role !== undefined) {
        const rol = await this.rolService.assertExiste(updateUsuarioDto.role);
        user.role = rol.clave;
      }
      if (updateUsuarioDto.roles !== undefined) {
        if (updateUsuarioDto.roles.length === 0) {
          throw new BadRequestException('Debe indicar al menos un rol.');
        }
        const roles = await this.rolService.assertExisten(
          updateUsuarioDto.roles,
        );
        user.role = roles[0].clave;
        await this.reemplazarRolesUsuario(
          user.id,
          roles.map((rol) => rol.id),
        );
      }
      if (updateUsuarioDto.isActive !== undefined) {
        user.isActive = updateUsuarioDto.isActive;
      }
    }

    const guardado = await this.usuarioRepository.save(user);
    return this.sinSecretos({
      ...guardado,
      roles: await this.obtenerRolesDeUsuario(guardado.id),
    });
  }

  async remove(id: number, actorId?: number) {
    if (actorId != null && id === actorId) {
      throw new BadRequestException('No puede inactivar su propia cuenta.');
    }
    const user = await this.usuarioRepository.findOneBy({ id, isActive: true });

    if (!user) {
      throw new NotFoundException(`El usuario con el id ${id} no existe`);
    }

    user.isActive = false;
    return this.sinSecretos(await this.usuarioRepository.save(user));
  }

  // Consulta GoMeta una sola vez por cédula mientras la respuesta siga fresca.
  async obtenerNombrePorCedula(cedula: string): Promise<string | null> {
    const cedulaNormalizada = cedula.replace(/\D/g, '');
    if (cedulaNormalizada.length !== 9) return null;

    const cacheada = this.cedulasCache.get(cedulaNormalizada);
    if (cacheada && cacheada.venceEn > Date.now()) return cacheada.nombre;

    const enCurso = this.consultasCedula.get(cedulaNormalizada);
    if (enCurso) return enCurso;

    const consulta = this.consultarNombrePorCedula(cedulaNormalizada);
    this.consultasCedula.set(cedulaNormalizada, consulta);

    try {
      const nombre = await consulta;
      this.guardarEnCacheCedula(cedulaNormalizada, nombre);
      return nombre;
    } finally {
      this.consultasCedula.delete(cedulaNormalizada);
    }
  }

  // Saca las entradas vencidas y, si sigue llena, las más viejas: la caché no
  // puede crecer sin límite aunque nadie vuelva a repetir una cédula.
  private guardarEnCacheCedula(cedula: string, nombre: string | null) {
    if (this.cedulasCache.size >= LIMITE_CACHE_CEDULAS) {
      const ahora = Date.now();
      for (const [clave, entrada] of this.cedulasCache) {
        if (entrada.venceEn <= ahora) this.cedulasCache.delete(clave);
      }
      while (this.cedulasCache.size >= LIMITE_CACHE_CEDULAS) {
        const masVieja = this.cedulasCache.keys().next();
        if (masVieja.done) break;
        this.cedulasCache.delete(masVieja.value);
      }
    }

    this.cedulasCache.set(cedula, {
      nombre,
      venceEn: Date.now() + 86_400_000, // la identidad no cambia y así se evita castigar a GoMeta
    });
  }

  // Protege el endpoint si el proveedor externo queda colgado.
  private async consultarNombrePorCedula(
    cedula: string,
  ): Promise<string | null> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 7_000);

    try {
      const respuesta = await fetch(
        `https://apis.gometa.org/cedulas/${cedula}`,
        {
          signal: abortController.signal,
        },
      );
      if (!respuesta.ok) return null;
      const data: unknown = await respuesta.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'nombre' in data &&
        typeof data.nombre === 'string'
      ) {
        return data.nombre;
      }
      return null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async findByUserName(userName: string) {
    const data = await this.usuarioRepository.find({
      where: {
        nombre: ILike(`%${userName}%`),
        isActive: true,
      },
    });
    if (data.length === 0) {
      throw new NotFoundException('No existen coincidencias');
    }
    return plainToInstance(UsuarioRespuestaDto, data);
  }
}
