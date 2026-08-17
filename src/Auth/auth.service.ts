import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { UsuarioService } from '../Users/usuario.service';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'secretRefreshToken';
  }

  private async getTokens(userId: number, email: string, role: string) {
    const payload = { jti: randomUUID(), sub: userId, email, role };

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

  prueba(user: any) {
    return user;
  }
}
