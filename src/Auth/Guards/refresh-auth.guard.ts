import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_COOKIE } from '../auth-cookies';

@Injectable()
export class RefreshAuthGuard implements CanActivate {
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'secretRefreshToken';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.refreshSecret,
      });
      request['user'] = payload;
      request['refreshToken'] = token;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  // La cookie HttpOnly evita que el refresh token quede disponible para scripts.
  private extractToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) return token;

    const cookie = request.headers.cookie;
    const value = cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_TOKEN_COOKIE}=`))
      ?.slice(REFRESH_TOKEN_COOKIE.length + 1);

    return value ? decodeURIComponent(value) : undefined;
  }
}
