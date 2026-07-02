import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUsuarioDto } from './DTO/create-usuario.dto';
import { UpdateUsuarioDto } from './DTO/update-usuario.dto';
import { Usuario } from './Entities/usuario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsuarioService {

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>
  ) { }

  create(createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioRepository.save(createUsuarioDto);
  }

  findAll() {
    return `This action returns all usuario`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usuario`;
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
        role: true
      }
    });
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
