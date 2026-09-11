import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './Entities/usuario.entity';
import { Rol } from './Entities/rol.entity';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol])],
  controllers: [UsuarioController, RolController],
  providers: [UsuarioService, RolService],
  exports: [UsuarioService, RolService],
})
export class UsuarioModule {}
