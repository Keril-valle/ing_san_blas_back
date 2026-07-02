import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './DTO/login.dto';
import { RegisterDto } from './DTO/register.dto';
import { UsuarioService } from '../Users/usuario.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

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

    const payload = { email: user.email, role: user.role };//siempre se usa informacion publica, no poner nada privado porque cualquiera lo puede ver
    const token = await this.jwtService.signAsync(payload);//firmamos el payload con la clave secreta

    return { token, email: user.email };
  }

  // Método para registrar un nuevo usuario y cifrar su contraseña antes de guardarla.
  async register(registerDto: RegisterDto) {
    const existingUser = await this.usuarioService.findOneByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Usuario ya existe');
    }

    //esta linea de codigo sirve para encriptar la contraseña y son 15 vueltas que da para encriptarla
    registerDto.password = await bcrypt.hash(registerDto.password, 15);
    return this.usuarioService.create(registerDto);
  }

  prueba(user: any) {
    return user;
  }
}
