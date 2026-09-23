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
import getNombreCedula from '../Common/Helpers/nombreCedula';
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

@Injectable()
export class UsuarioService {
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
    return saved;
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
      .then((usuarios) => plainToInstance(UsuarioRespuestaDto, usuarios));
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
      data: plainToInstance(UsuarioRespuestaDto, data),
      total,
      page: pagina,
      pages: Math.ceil(total / limite),
      limit: limite,
    };
  }

  async findOne(id: number) {
    const user = await this.usuarioRepository.findOneBy({ id, isActive: true });
    if (!user) return null;
    return plainToInstance(UsuarioRespuestaDto, user);
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

    return await this.usuarioRepository.save(user);
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
    return await this.usuarioRepository.save(user);
  }

  async obtenerNombrePorCedula(cedula: string) {
    const data = await getNombreCedula(cedula);
    return data;
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
