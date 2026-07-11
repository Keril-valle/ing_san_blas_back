import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Usuario } from './Entities/usuario.entity';
import { Repository, DataSource } from 'typeorm';
import getNombreCedula from 'src/Common/Helpers/nombreCedula';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  create(createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioRepository.save(createUsuarioDto);
  }

  findAll() {
    return `This action returns all usuario`;
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ id });
  }
  findOneByEmail(email: string) {
    return this.usuarioRepository.findOneBy({ email });
  }
  findByEmailWithPassword(email: string) {
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
  async findByIdWithRefreshToken(id: number) {
    const rows = await this.usuarioRepository.manager.query(
      'SELECT id, email, role, "refreshTokenHash" FROM usuario WHERE id = ?',
      [id],
    );
    return rows.length > 0 ? (rows[0] as Usuario) : null;
  }

  async setRefreshTokenHash(id: number, hash: string | null) {
    await this.usuarioRepository.manager.query(
      'UPDATE usuario SET "refreshTokenHash" = ? WHERE id = ?',
      [hash, id],
    );
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }

  async obtenerNombrePorCedula(cedula: string) {
    const data = await getNombreCedula(cedula);
    return data;
  }
}


