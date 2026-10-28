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
import type { FindOptionsWhere } from 'typeorm';
import { randomBytes } from 'node:crypto';
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

// Resultado de consultar una cédula en el registro externo. Distingue "no
// existe" de "el proveedor falló" para que el frontend muestre el mensaje correcto.
export type ResultadoConsultaCedula =
  | { estado: 'encontrada'; nombre: string }
  | { estado: 'no_encontrada' }
  | { estado: 'error' };

const TTL_CEDULA_ENCONTRADA_MS = 86_400_000; // 24 h: la identidad no cambia
const TTL_CEDULA_NO_ENCONTRADA_MS = 5 * 60_000; // 5 min: permite reintentar pronto sin castigar a GoMeta

@Injectable()
export class UsuarioService {
  private readonly cedulasCache = new Map<
    string,
    { resultado: ResultadoConsultaCedula; venceEn: number }
  >();
  private readonly consultasCedula = new Map<
    string,
    Promise<ResultadoConsultaCedula>
  >();

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly rolService: RolService,
  ) {}

  async createUser(registerDto: RegisterDto | CreateUsuarioDto) {
    const passwordPlano = this.passwordPlanoParaAlta(registerDto);

    const existingUser = await this.usuarioRepository.findOneBy({
      email: ILike(registerDto.email),
    });
    if (existingUser) {
      throw new ConflictException(
        existingUser.isActive
          ? 'El correo ya está registrado.'
          : 'Ya existe una cuenta con este correo, pero está inactiva. Reenvíe el enlace de activación desde el listado de usuarios inactivos en lugar de crear una nueva.',
      );
    }

    const hashedPassword = await bcrypt.hash(passwordPlano, 12);
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
      isActive: false,
    });

    const saved = await this.usuarioRepository.save(user);
    await this.reemplazarRolesUsuario(
      saved.id,
      roles.map((rol) => rol.id),
    );
    // saved trae el hash en memoria: sin el DTO la respuesta lo filtra al frontend
    return this.aRespuestaDto(saved, roles.map((rol) => rol.clave));
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

  private pendienteActivacionDe(usuario: Usuario): boolean {
    return !usuario.isActive && !usuario.passwordChangedAt;
  }

  private aRespuestaDto(usuario: Usuario, roles: string[]) {
    return plainToInstance(UsuarioRespuestaDto, {
      ...usuario,
      roles,
      pendienteActivacion: this.pendienteActivacionDe(usuario),
    });
  }

  private async conRoles(
    usuarios: Usuario[],
  ): Promise<
    Array<Usuario & { roles: string[]; pendienteActivacion: boolean }>
  > {
    return Promise.all(
      usuarios.map(async (usuario) => ({
        ...usuario,
        roles: await this.obtenerRolesDeUsuario(usuario.id),
        pendienteActivacion: this.pendienteActivacionDe(usuario),
      })),
    );
  }

  /** Alta por panel: placeholder aleatorio. Registro con password: valida confirmación. */
  private passwordPlanoParaAlta(
    dto: RegisterDto | CreateUsuarioDto,
  ): string {
    if ('password' in dto && typeof dto.password === 'string') {
      if (dto.password !== dto.confirmPassword) {
        throw new BadRequestException('Las contraseñas no coinciden');
      }
      return dto.password;
    }
    return randomBytes(32).toString('base64url');
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
    for (const rolId of rolIds) {
      await this.usuarioRepository.manager.query(
        'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)',
        [usuarioId, rolId],
      );
    }
  }

  findAll() {
    return this.usuarioRepository
      .find({ where: { isActive: true } })
      .then(async (usuarios) =>
        (await this.conRoles(usuarios)).map((u) =>
          this.aRespuestaDto(u, u.roles),
        ),
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
      // Filtra por roles reales (tabla usuario_roles), no solo la columna legacy.
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM usuario_roles ur
          INNER JOIN rol r ON r.id = ur.rol_id
          WHERE ur.usuario_id = usuario.id AND r.clave = :role
        )`,
        { role: rolFiltro },
      );
    }

    if (estadoFiltro === 'active') {
      qb.andWhere('usuario.isActive = :isActive', { isActive: true });
    } else if (estadoFiltro === 'inactive') {
      qb.andWhere('usuario.isActive = :isActive', { isActive: false });
    }
    // Sin state, o state=all: activos e inactivos (listado por defecto).

    if (texto) {
      qb.andWhere(
        '(LOWER(usuario.nombre) LIKE LOWER(:texto) OR LOWER(usuario.email) LIKE LOWER(:texto) OR LOWER(usuario.telefono) LIKE LOWER(:texto))',
        { texto: `%${texto}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();

    const conRoles = await this.conRoles(data);
    return {
      data: conRoles.map((u) => this.aRespuestaDto(u, u.roles)),
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
    return this.aRespuestaDto(conRol, conRol.roles);
  }

  async findOneByEmail(email: string) {
    const user = await this.usuarioRepository.findOneBy({
      email,
      isActive: true,
    });
    if (!user) return null;
    const [conRol] = await this.conRoles([user]);
    return this.aRespuestaDto(conRol, conRol.roles);
  }

  findActivoParaRecuperacion(email: string) {
    return this.usuarioRepository.findOne({
      where: { email: ILike(email.trim()), isActive: true },
      select: { id: true, email: true, nombre: true },
    });
  }

  findInactivoParaActivacion(email: string) {
    return this.usuarioRepository.findOne({
      where: { email: ILike(email.trim()), isActive: false },
      select: { id: true, email: true, nombre: true, isActive: true },
    });
  }

  findParaActivacionPorId(id: number) {
    return this.usuarioRepository.findOne({
      where: { id },
      select: { id: true, email: true, nombre: true, isActive: true },
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
      // El correo no distingue mayúsculas/minúsculas al iniciar sesión.
      where: { email: ILike(email.trim()), isActive: true },
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
    const rows = await this.usuarioRepository.manager.query(
      'SELECT id, email, role, "refreshTokenHash" FROM usuario WHERE id = $1 AND "isActive" = true',
      [id],
    );
    return rows.length > 0 ? (rows[0] as Usuario) : null;
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
    // Se busca sin filtrar por isActive: una cuenta inactiva también debe poder
    // editarse y, sobre todo, reactivarse desde el panel.
    const user = await this.usuarioRepository.findOneBy({ id });

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
        const estabaActiva = user.isActive;

        if (updateUsuarioDto.isActive && !estabaActiva) {
          const activaConMismoEmail = await this.usuarioRepository.findOneBy({
            email: ILike(user.email),
            isActive: true,
          });
          if (activaConMismoEmail && activaConMismoEmail.id !== user.id) {
            throw new ConflictException(
              `Ya existe otra cuenta activa con este correo (ID ${activaConMismoEmail.id}). Desactívela primero o cambie su correo antes de reactivar esta cuenta.`,
            );
          }
        }

        user.isActive = updateUsuarioDto.isActive;

        // Desactivar debe cortar las sesiones abiertas: se limpia el refresh
        // token y se adelanta passwordChangedAt para que los access tokens
        // emitidos antes dejen de ser válidos. Al reactivar se exige un login
        // nuevo, de modo que una sesión vieja no revive con la cuenta.
        if (!user.isActive || !estabaActiva) {
          user.refreshTokenHash = null;
          user.passwordChangedAt = new Date();
        }
      }
    }

    const guardado = await this.usuarioRepository.save(user);
    // al cambiar la contraseña el hash queda en el objeto guardado: el DTO lo descarta
    return this.aRespuestaDto(
      guardado,
      await this.obtenerRolesDeUsuario(guardado.id),
    );
  }

  async remove(id: number, actorId?: number) {
    if (actorId != null && id === actorId) {
      throw new BadRequestException('No puede inactivar su propia cuenta.');
    }
    const user = await this.usuarioRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`El usuario con el id ${id} no existe`);
    }

    // Cuenta ya inactiva: se borra del todo (libera el correo para un alta nueva).
    if (!user.isActive) {
      await this.usuarioRepository.manager.query(
        'DELETE FROM usuario_roles WHERE usuario_id = $1',
        [id],
      );
      await this.usuarioRepository.remove(user);
      return this.aRespuestaDto(user, []);
    }

    user.isActive = false;
    // Igual que al desactivar desde el formulario: se revocan las sesiones
    // abiertas para que no vuelvan a servir si la cuenta se reactiva.
    user.refreshTokenHash = null;
    user.passwordChangedAt = new Date();
    const guardado = await this.usuarioRepository.save(user);
    const [conRol] = await this.conRoles([guardado]);
    return this.aRespuestaDto(conRol, conRol.roles);
  }

  // Consulta GoMeta una sola vez por cédula mientras la respuesta siga fresca.
  // Los aciertos se cachean 24 h; los "no encontrada" solo 5 min; los fallos del
  // proveedor no se cachean, de modo que se puede reintentar.
  async obtenerNombrePorCedula(
    cedula: string,
  ): Promise<ResultadoConsultaCedula> {
    const cedulaNormalizada = cedula.replace(/\D/g, '');
    if (cedulaNormalizada.length !== 9) return { estado: 'no_encontrada' };

    const cacheada = this.cedulasCache.get(cedulaNormalizada);
    if (cacheada && cacheada.venceEn > Date.now()) return cacheada.resultado;

    const enCurso = this.consultasCedula.get(cedulaNormalizada);
    if (enCurso) return enCurso;

    const consulta = this.consultarNombrePorCedula(cedulaNormalizada);
    this.consultasCedula.set(cedulaNormalizada, consulta);

    try {
      const resultado = await consulta;
      if (resultado.estado !== 'error') {
        this.cedulasCache.set(cedulaNormalizada, {
          resultado,
          venceEn:
            Date.now() +
            (resultado.estado === 'encontrada'
              ? TTL_CEDULA_ENCONTRADA_MS
              : TTL_CEDULA_NO_ENCONTRADA_MS),
        });
      }
      return resultado;
    } finally {
      this.consultasCedula.delete(cedulaNormalizada);
    }
  }

  // Protege el endpoint si el proveedor externo queda colgado.
  private async consultarNombrePorCedula(
    cedula: string,
  ): Promise<ResultadoConsultaCedula> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 7_000);

    try {
      const respuesta = await fetch(
        `https://apis.gometa.org/cedulas/${cedula}`,
        {
          signal: abortController.signal,
        },
      );
      if (!respuesta.ok) return { estado: 'error' };
      const data: unknown = await respuesta.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'nombre' in data &&
        typeof data.nombre === 'string' &&
        data.nombre.trim() !== ''
      ) {
        return { estado: 'encontrada', nombre: data.nombre };
      }
      return { estado: 'no_encontrada' };
    } catch {
      return { estado: 'error' };
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
    const conRoles = await this.conRoles(data);
    return conRoles.map((u) => this.aRespuestaDto(u, u.roles));
  }
}
