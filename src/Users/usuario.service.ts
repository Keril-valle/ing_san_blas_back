import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from '../Auth/DTO/register.dto';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Role } from '../Common/Enums/Roles';
import { Usuario } from './Entities/usuario.entity';
import { RolService } from './rol.service';
import { Repository, ILike } from 'typeorm';
import getNombreCedula from '../Common/Helpers/nombreCedula';
import * as bcrypt from 'bcryptjs';

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

    const existingUser = await this.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('El ingresado email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const roleSolicitado =
      'role' in registerDto && typeof registerDto.role === 'string'
        ? registerDto.role.trim()
        : Role.USER;
    const rol = await this.rolService.assertExiste(roleSolicitado);
    const telefono =
      'telefono' in registerDto && typeof registerDto.telefono === 'string'
        ? registerDto.telefono
        : null;
    const user = this.usuarioRepository.create({
      nombre: registerDto.nombre,
      email: registerDto.email,
      password: hashedPassword,
      role: rol.clave,
      telefono,
    });

    return this.usuarioRepository.save(user);
  }

  findAll() {
    return this.usuarioRepository.find({ where: { isActive: true } });
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ id, isActive: true });
  }

  findOneByEmail(email: string) {
    return this.usuarioRepository.findOneBy({ email, isActive: true });
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

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto, actorId?: number) {
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
    return data;
  }
}
