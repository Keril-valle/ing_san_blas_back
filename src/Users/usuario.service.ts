import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Usuario } from './Entities/usuario.entity';
import { Repository, ILike } from 'typeorm';
import getNombreCedula from '../Common/Helpers/nombreCedula';
import bcrypt from 'node_modules/bcryptjs/umd/types';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  create(createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioRepository.save(createUsuarioDto); //esto no se usa, cuando se hace un user se pasa por el register que tiene un controlador distinto
  }

  findAll() {
    return this.usuarioRepository.find();
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ id });
  }
  findOneByEmail(email: string) {
    return this.usuarioRepository.findOneBy({ email });
  }
  findByEmailWithPassword(email: string) {//esto lo usa Auth
    return this.usuarioRepository.findOne({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        password: true,
        role: true,
      },
    });
  }
  async findByIdWithRefreshToken(id: number) {//esto lo usa Auth
    const rows = await this.usuarioRepository.manager.query(
      'SELECT id, email, role, "refreshTokenHash" FROM usuario WHERE id = $1',
      [id],
    );
    return rows.length > 0 ? (rows[0] as Usuario) : null;
  }

  async setRefreshTokenHash(id: number, hash: string | null) {//esto lo usa Auth
    await this.usuarioRepository.manager.query(
      'UPDATE usuario SET "refreshTokenHash" = $1 WHERE id = $2',
      [hash, id],
    );
  }

  async UserUpdate(id: number, updateUsuarioDto: UpdateUsuarioDto) {//falta la validacion del correo que no exista ya en la db
    const user = await this.usuarioRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`El usuario con el id ${id} no existe`);
    }

    if (updateUsuarioDto.password !== undefined) {//valida si el usuario solicita cambiar la contraseña
      if (updateUsuarioDto.confirmPassword !== updateUsuarioDto.password) {
        throw new BadRequestException('La contraseña no coincide');
      } else {
        user.password = await bcrypt.hash(updateUsuarioDto.password, 10);
      }
    }
    user.nombre = updateUsuarioDto.nombre ?? user.nombre;
    user.email = updateUsuarioDto.email ?? user.email;
    return await this.usuarioRepository.save(user);
    //hay alguien en el codigo que ya valida los requisitos de la contraseña, puedo reutilizarlo para la acutalizacion
    //para comproobar que si se haga como tiene q hacerse
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }

  async obtenerNombrePorCedula(cedula: string) {
    const data = await getNombreCedula(cedula);
    return data;
  }

  async findByUserName(userName: string) {
    const data = await this.usuarioRepository.find({
      where: {
        nombre: ILike(`%${userName}%`),
      },
    });
    if (data.length === 0) {
      throw new NotFoundException('No existen coincidencias');
    }
    return data;
  }
}
