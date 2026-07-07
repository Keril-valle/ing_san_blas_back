import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { UsuarioService } from '../Users/usuario.service';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}
  // Método para generar tokens de acceso y actualización para un usuario autenticado.
  private async getTokens(userId: number, email: string, role: string) {
    const payload = { jti: randomUUID(), sub: userId, email, role };//siempre se usa informacion publica, no poner nada privado porque cualquiera lo puede ver
    //jti al inicio para que el token difiera dentro de los primeros 72 bytes (límite de bcrypt)

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload), // usa el secret/expiresIn global (access) //firmamos el payload con la clave secreta
      this.jwtService.signAsync(payload, {
        secret: 'secretRefreshToken', // usa el secret/expiresIn global (refresh)
        expiresIn:'7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
private hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
  // Método para actualizar el hash del token de actualización en la base de datos.
 private async updateRefreshTokenHash(userId: number, refreshToken: string) {
  const hash = this.hashToken(refreshToken);
  await this.usuarioService.setRefreshTokenHash(userId, hash);
}

  // Método para autenticar un usuario mediante email y contraseña.
  async login(loginDto: LoginDto) {
    const user = await this.usuarioService.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrecta');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email o contraseña incorrecta');
    }

   const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return { ...tokens, email: user.email };
  }

  // Método para registrar un nuevo usuario y cifrar su contraseña antes de guardarla.
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Usuario ya existe');
    }

    //esta linea de codigo sirve para encriptar la contraseña y son 12 vueltas que da para encriptarla
    registerDto.password = await bcrypt.hash(registerDto.password, 12);
    return this.usuarioService.create(registerDto);
  }
  // Método para refrescar los tokens de acceso y actualización utilizando un token de actualización válido.
   async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usuarioService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshTokenHash) throw new ForbiddenException('Acceso denegado');

    const incomingHash = this.hashToken(refreshToken);
const matches = incomingHash === user.refreshTokenHash;
    if (!matches) throw new ForbiddenException('Acceso denegado');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }
  // Método para cerrar sesión de un usuario, eliminando el hash del token de actualización de la base de datos.
  async logout(userId: number) {
    await this.usuarioService.setRefreshTokenHash(userId, null);
    return { message: 'Sesión cerrada' };
  }

  prueba(user: any) {
    return user;
  }
}
