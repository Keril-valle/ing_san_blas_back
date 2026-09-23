import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { RestablecerContrasenaDto } from './DTO/restablecer-contrasena.dto';
import { RecuperacionContrasena } from './Entities/recuperacion-contrasena.entity';
import { UsuarioService } from '../Users/usuario.service';
import { RolService } from '../Users/rol.service';
import { Usuario } from '../Users/Entities/usuario.entity';
import { AuthMailService } from '../Notifications/Services/auth-mail.service';

const MENSAJE_RECUPERACION =
  'Si existe una cuenta asociada a este correo, recibirás instrucciones para recuperar tu contraseña.';
const MINUTOS_EXPIRACION_RECUPERACION = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly rolService: RolService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly authMailService: AuthMailService,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'secretRefreshToken';
  }

  private async getTokens(userId: number, email: string, role: string) {
    const rol = await this.rolService.findByClave(role);
    const accesoPanel = this.rolService.tieneAccesoPanel(rol);
    const payload = {
      jti: randomUUID(),
      sub: userId,
      email,
      role,
      accesoPanel,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.usuarioService.setRefreshTokenHash(userId, hash);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usuarioService.findByEmailWithPassword(
      loginDto.email,
    );
    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrecta');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrecta');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return { ...tokens, email: user.email };
  }

  async register(registerDto: RegisterDto) {
    await this.usuarioService.createUser(registerDto);
    return this.login(registerDto);
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usuarioService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshTokenHash)
      throw new ForbiddenException('Acceso denegado');

    const incomingHash = this.hashToken(refreshToken);
    const matches = incomingHash === user.refreshTokenHash;
    if (!matches) {
      await this.usuarioService.setRefreshTokenHash(userId, null);
      throw new ForbiddenException('Acceso denegado');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number) {
    await this.usuarioService.setRefreshTokenHash(userId, null);
    return { message: 'Sesión cerrada' };
  }

  async solicitarRecuperacion(email: string) {
    const usuario = await this.usuarioService.findActivoParaRecuperacion(email);
    if (!usuario) {
      this.hashToken(randomBytes(32).toString('base64url'));
      return { message: MENSAJE_RECUPERACION };
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + MINUTOS_EXPIRACION_RECUPERACION * 60 * 1000,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(RecuperacionContrasena)
        .set({ usedAt: new Date() })
        .where('"usuarioId" = :usuarioId AND "usedAt" IS NULL', {
          usuarioId: usuario.id,
        })
        .execute();
      await manager.getRepository(RecuperacionContrasena).save({
        usuarioId: usuario.id,
        tokenHash,
        expiresAt,
        usedAt: null,
      });
    });

    const frontend = this.configService
      .get<string>('FRONTEND_URL')
      ?.trim()
      .replace(/\/$/, '');
    if (!frontend) {
      this.logger.error(
        'FRONTEND_URL no configurada. No se envió el enlace de recuperación.',
      );
      return { message: MENSAJE_RECUPERACION };
    }

    try {
      await this.authMailService.enviarRecuperacionContrasena({
        correo: usuario.email,
        nombre: usuario.nombre ?? '',
        enlace: `${frontend}/reset-password?token=${encodeURIComponent(token)}`,
        minutos: MINUTOS_EXPIRACION_RECUPERACION,
      });
    } catch {
      this.logger.error(
        `No se pudo enviar el enlace de recuperación a ${usuario.email}.`,
      );
    }

    return { message: MENSAJE_RECUPERACION };
  }

  async restablecerContrasena(dto: RestablecerContrasenaDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const tokenHash = this.hashToken(dto.token);

    await this.dataSource.transaction(async (manager) => {
      const fila = await manager
        .getRepository(RecuperacionContrasena)
        .createQueryBuilder('recuperacion')
        .setLock('pessimistic_write')
        .where('recuperacion.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      if (!fila) {
        throw new BadRequestException('El enlace no es válido.');
      }
      if (fila.usedAt) {
        throw new BadRequestException('Este enlace ya fue utilizado.');
      }
      if (fila.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('El enlace expiró. Solicite uno nuevo.');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      await manager.update(Usuario, fila.usuarioId, {
        password: passwordHash,
        passwordChangedAt: new Date(),
      });
      await manager.query(
        'UPDATE "usuario" SET "refreshTokenHash" = NULL WHERE id = $1',
        [fila.usuarioId],
      );
      fila.usedAt = new Date();
      await manager.save(fila);
    });

    return { message: 'La contraseña se actualizó correctamente.' };
  }

  prueba(user: any) {
    return user;
  }
}
