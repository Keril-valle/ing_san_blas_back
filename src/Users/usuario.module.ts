import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Usuario } from './Entities/usuario.entity';
import { Rol } from './Entities/rol.entity';
import { UsuarioRol } from './Entities/usuario-rol.entity';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { AuthModule } from '../Auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Rol, UsuarioRol]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsuarioController, RolController],
  providers: [UsuarioService, RolService],
  exports: [UsuarioService, RolService],
})
export class UsuarioModule {}
