import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuarioModule } from '../Users/usuario.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './Guards/auth.guard';
import { RolesGuard } from './Guards/roles.guard';
@Module({
  imports: [
    UsuarioModule,
    // JWT config desde variables de entorno (Vercel) o fallback local
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') ?? 'secret-key',
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
