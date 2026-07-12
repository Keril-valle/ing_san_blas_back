import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuarioModule } from '../Users/usuario.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './Guards/auth.guard';
import { RolesGuard } from './Guards/roles.guard';

@Module({
  imports: [
    // Importamos el módulo de usuarios para trabajar con la entidad Usuario.
    UsuarioModule,
    // Las configuraciones de JWT se ponen aquí, al ser global el token estará disponible en todos los módulos.
    JwtModule.register({
      global: true,
      secret: 'secret-key',
      signOptions: { expiresIn: '15m' }, //el signoption es para que el token expire en | 15 minutos, esto es importante para la seguridad de la aplicacion
    }), //las configuraciones de jwt se ponen aqui, al ser global el token estara disponible en todos los modulos
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard }, // se ejecuta en TODAS las rutas de la app
    { provide: APP_GUARD, useClass: RolesGuard }, // se ejecuta después, revisa @Roles si existe
  ],
})
export class AuthModule {}
