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
import { Role } from '../Common/Enums/Roles';
import { LoginDto } from './DTO/login.dto';
import { RestablecerContrasenaDto } from './DTO/restablecer-contrasena.dto';
import { ValidarEnlaceRecuperacionDto } from './DTO/validar-enlace-recuperacion.dto';
import { RecuperacionContrasena } from './Entities/recuperacion-contrasena.entity';
import { ActivacionCuenta } from './Entities/activacion-cuenta.entity';
import { UsuarioService } from '../Users/usuario.service';
import { RolService } from '../Users/rol.service';
import { Usuario } from '../Users/Entities/usuario.entity';
import { AuthMailService } from '../Notifications/Services/auth-mail.service';
import { ActivarCuentaDto } from './DTO/activar-cuenta.dto';
import { ValidarEnlaceActivacionDto } from './DTO/validar-enlace-activacion.dto';

const MENSAJE_RECUPERACION =
  'Si existe una cuenta asociada a este correo, recibirás instrucciones para recuperar tu contraseña.';
const MENSAJE_REENVIO_ACTIVACION =
  'Si existe una cuenta pendiente de activación con este correo, recibirás un nuevo enlace.';
const MINUTOS_EXPIRACION_RECUPERACION = 15;
const HORAS_EXPIRACION_ACTIVACION = 24;

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
    const roles = await this.usuarioService.obtenerRolesDeUsuario(userId);
    const rolesEfectivos = roles.length > 0 ? roles : [role];
    const permisos = await this.rolService.permisosDeRoles(rolesEfectivos);
    const accesoPanel =
      permisos.includes('panel') || rolesEfectivos.includes(Role.SECRETARIO);
    const payload = {
      jti: randomUUID(),
      sub: userId,
      email,
      role,
      roles: rolesEfectivos,
      permisos,
      accesoPanel,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        role,
        roles: rolesEfectivos,
        permisos,
        accesoPanel,
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private mensajeSiEnlaceNoSirve(
    fila: Pick<
      RecuperacionContrasena | ActivacionCuenta,
      'usedAt' | 'expiresAt'
    > | null,
  ): string | null {
    if (!fila) {
      return 'El enlace no es válido.';
    }
    if (fila.usedAt) {
      return 'Este enlace ya fue utilizado.';
    }
    if (fila.expiresAt.getTime() <= Date.now()) {
      return 'El enlace expiró. Solicite uno nuevo.';
    }
    return null;
  }

  private frontendBase(): string | null {
    const frontend = this.configService
      .get<string>('FRONTEND_URL')
      ?.trim()
      .replace(/\/$/, '');
    return frontend || null;
  }

  /** Crea token de un solo uso y envía el correo. No expone el token. */
  async emitirActivacion(usuarioId: number): Promise<boolean> {
    const usuario = await this.usuarioService.findParaActivacionPorId(usuarioId);
    if (!usuario) {
      throw new BadRequestException(
        'Solo se puede enviar activación a cuentas inactivas.',
      );
    }
    if (usuario.isActive) {
      throw new BadRequestException('Esta cuenta ya está activada.');
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(
      Date.now() + HORAS_EXPIRACION_ACTIVACION * 60 * 60 * 1000,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ActivacionCuenta)
        .set({ usedAt: new Date() })
        .where('"usuarioId" = :usuarioId AND "usedAt" IS NULL', {
          usuarioId: usuario.id,
        })
        .execute();
      await manager.getRepository(ActivacionCuenta).save({
        usuarioId: usuario.id,
        tokenHash,
        expiresAt,
        usedAt: null,
      });
    });

    const frontend = this.frontendBase();
    if (!frontend) {
      this.logger.error(
        'FRONTEND_URL no configurada. No se envió el enlace de activación.',
      );
      return false;
    }

    try {
      await this.authMailService.enviarActivacionCuenta({
        correo: usuario.email,
        nombre: usuario.nombre ?? '',
        enlace: `${frontend}/activar-cuenta?token=${encodeURIComponent(token)}`,
        horas: HORAS_EXPIRACION_ACTIVACION,
      });
      return true;
    } catch {
      this.logger.error(
        `No se pudo enviar el enlace de activación a ${usuario.email}.`,
      );
      return false;
    }
  }

  async validarEnlaceActivacion(dto: ValidarEnlaceActivacionDto) {
    const fila = await this.dataSource.getRepository(ActivacionCuenta).findOne({
      where: { tokenHash: this.hashToken(dto.token) },
      select: { id: true, usuarioId: true, usedAt: true, expiresAt: true },
    });
    const mensaje = this.mensajeSiEnlaceNoSirve(fila);
    if (mensaje) {
      throw new BadRequestException(mensaje);
    }

    const usuario = await this.usuarioService.findParaActivacionPorId(
      fila!.usuarioId,
    );
    if (!usuario) {
      throw new BadRequestException('El enlace no es válido.');
    }
    if (usuario.isActive) {
      throw new BadRequestException('Esta cuenta ya fue activada.');
    }

    return { valido: true };
  }

  async activarCuenta(dto: ActivarCuentaDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const tokenHash = this.hashToken(dto.token);
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.dataSource.transaction(async (manager) => {
      const fila = await manager
        .getRepository(ActivacionCuenta)
        .createQueryBuilder('activacion')
        .setLock('pessimistic_write')
        .where('activacion.tokenHash = :tokenHash', { tokenHash })
        .getOne();

      const mensaje = this.mensajeSiEnlaceNoSirve(fila);
      if (!fila || mensaje) {
        throw new BadRequestException(mensaje ?? 'El enlace no es válido.');
      }

      const usuario = await manager.getRepository(Usuario).findOne({
        where: { id: fila.usuarioId },
        select: { id: true, isActive: true },
      });
      if (!usuario) {
        throw new BadRequestException('El enlace no es válido.');
      }
      if (usuario.isActive) {
        throw new BadRequestException('Esta cuenta ya fue activada.');
      }

      await manager.update(Usuario, fila.usuarioId, {
        isActive: true,
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

    return {
      message:
        'Tu cuenta fue activada correctamente. Ya puedes iniciar sesión con tu correo y la contraseña que elegiste.',
    };
  }

  async solicitarReenvioActivacion(email: string) {
    const usuario =
      await this.usuarioService.findInactivoParaActivacion(email);
    if (!usuario) {
      this.hashToken(randomBytes(32).toString('base64url'));
      return { message: MENSAJE_REENVIO_ACTIVACION };
    }

    await this.emitirActivacion(usuario.id);
    return { message: MENSAJE_REENVIO_ACTIVACION };
  }

  async reenviarActivacionUsuario(usuarioId: number) {
    const enviado = await this.emitirActivacion(usuarioId);
    if (!enviado) {
      throw new BadRequestException(
        'No se pudo enviar el correo de activación. Verifique la configuración de correo e intente de nuevo.',
      );
    }
    return { message: 'Se envió un nuevo enlace de activación.' };
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
    return tokens;
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

  // El frontend usa este perfil para renderizar permisos sin tener que leer el JWT.
  getSessionUser(user: {
    sub: number;
    email: string;
    role: string;
    roles?: string[];
    permisos?: string[];
    accesoPanel?: boolean;
  }) {
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
      roles: user.roles ?? [user.role],
      permisos: user.permisos ?? [],
      accesoPanel: user.accesoPanel ?? false,
    };
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

  async validarEnlaceRecuperacion(dto: ValidarEnlaceRecuperacionDto) {
    const fila = await this.dataSource
      .getRepository(RecuperacionContrasena)
      .findOne({
        where: { tokenHash: this.hashToken(dto.token) },
        select: { id: true, usedAt: true, expiresAt: true },
      });
    const mensaje = this.mensajeSiEnlaceNoSirve(fila);
    if (mensaje) {
      throw new BadRequestException(mensaje);
    }
    return { valido: true };
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

      const mensaje = this.mensajeSiEnlaceNoSirve(fila);
      if (!fila || mensaje) {
        throw new BadRequestException(mensaje ?? 'El enlace no es válido.');
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
