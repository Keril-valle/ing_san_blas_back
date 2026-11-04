import 'reflect-metadata';
import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource, ILike, type Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './Guards/auth.guard';
import { RolesGuard } from './Guards/roles.guard';
import { UsuarioService } from '../Users/usuario.service';
import { RolService } from '../Users/rol.service';
import { Usuario } from '../Users/Entities/usuario.entity';
import { Role } from '../Common/Enums/Roles';
import { GlobalExceptionFilter } from '../Common/Filters/global-exception.filter';
import { AuthMailService } from '../Notifications/Services/auth-mail.service';

const INVALIDAS = 'Email o contraseña incorrecta';
const PENDIENTE = 'Esta cuenta está pendiente de activación. Utiliza el enlace enviado a tu correo para crear tu contraseña.';

// Controlador, servicio, búsqueda de usuario, bcrypt, JWT y filtro reales.
// Solo la persistencia y el correo se simulan; no cambia cuentas reales.
describe('POST /auth/login: mensajes de error y reintentos', () => {
  let app: INestApplication;
  let hash: string;
  let logError: jest.SpyInstance;
  const repository = { findOne: jest.fn(), manager: { query: jest.fn() } };
  const roles = { permisosDeRoles: jest.fn(async () => []) };
  const usuarios = new UsuarioService(repository as unknown as Repository<Usuario>, roles as unknown as RolService);
  const jwt = new JwtService({ secret: 'solo-tests-login', signOptions: { expiresIn: '15m' } });
  const firmar = jest.spyOn(jwt, 'signAsync');
  const fila = (isActive: boolean, passwordChangedAt: Date | null = null) => ({
    id: 99, email: 'test@example.com', nombre: 'Prueba', password: hash,
    role: Role.USER, isActive, passwordChangedAt,
  });
  const enviar = (password = 'Correcta123!') => request(app.getHttpServer())
    .post('/auth/login').send({ email: 'test@example.com', password });

  beforeAll(async () => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    hash = await bcrypt.hash('Correcta123!', 4);
    const modulo = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsuarioService, useValue: usuarios },
        { provide: RolService, useValue: roles },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: DataSource, useValue: {} },
        { provide: AuthMailService, useValue: {} },
      ],
    }).compile();
    app = modulo.createNestApplication();
    const reflector = new Reflector();
    app.useGlobalGuards(new AuthGuard(jwt, reflector, usuarios), new RolesGuard(reflector));
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app?.close(); logError?.mockRestore(); });
  beforeEach(() => {
    jest.clearAllMocks();
    repository.findOne.mockReset().mockResolvedValue(fila(true));
    repository.manager.query.mockReset().mockImplementation(async (sql: string) =>
      sql.startsWith('SELECT r.clave') ? [{ clave: 'user' }] : []);
  });

  const sinSesion = (res: request.Response) => {
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(res.body).not.toHaveProperty('user');
    expect(firmar).not.toHaveBeenCalled();
    expect(repository.manager.query).not.toHaveBeenCalled();
  };

  it.each(['inexistente', 'activa', 'pendiente', 'desactivada'])(
    'clave incorrecta no identifica el correo ni el estado: %s', async (estado) => {
      repository.findOne.mockResolvedValue(estado === 'inexistente' ? null
        : fila(estado === 'activa', estado === 'desactivada' ? new Date() : null));
      const res = await enviar('Incorrecta123!').expect(401);
      expect(res.body.mensaje).toBe(INVALIDAS);
      sinSesion(res);
    },
  );

  it('cuenta pendiente: solo informa activación después de verificar la contraseña', async () => {
    repository.findOne.mockResolvedValue(fila(false));
    const res = await enviar().expect(403);
    expect(res.body.mensaje).toBe(PENDIENTE);
    sinSesion(res);
  });

  it('una cuenta desactivada no se confunde con pendiente ni recibe sesión', async () => {
    repository.findOne.mockResolvedValue(fila(false, new Date()));
    const res = await enviar().expect(401);
    expect(res.body.mensaje).toBe(INVALIDAS);
    sinSesion(res);
  });

  it('contraseña aleatoria de una cuenta nueva: error genérico, sin revelar activación', async () => {
    repository.findOne.mockResolvedValue({ ...fila(false), password: await bcrypt.hash('aleatoria-no-entregada', 4) });
    const res = await enviar().expect(401);
    expect(res.body.mensaje).toBe(INVALIDAS);
    sinSesion(res);
  });

  it('permite reintentar correctamente después del error', async () => {
    await enviar('Incorrecta123!').expect(401);
    const res = await enviar().expect(201);
    expect(res.body.user).toMatchObject({ id: 99, email: 'test@example.com' });
    expect(res.headers['set-cookie']).toHaveLength(2);
    expect(firmar).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(res.body)).not.toContain(hash);
  });

  it('cuenta pendiente luego activada: el mismo formulario puede volver a intentar', async () => {
    repository.findOne.mockResolvedValue(fila(false));
    await enviar().expect(403);
    repository.findOne.mockResolvedValue(fila(true, new Date()));
    const res = await enviar().expect(201);
    expect(res.body.user.id).toBe(99);
  });

  it('busca sin distinguir mayúsculas y selecciona el estado necesario sin filtrar solo activas', async () => {
    await enviar('Incorrecta123!').expect(401);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: ILike('test@example.com') },
      order: { isActive: 'DESC', id: 'DESC' },
      select: { id: true, nombre: true, email: true, password: true, role: true, isActive: true, passwordChangedAt: true },
    });
  });
});
