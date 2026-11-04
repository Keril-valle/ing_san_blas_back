import 'reflect-metadata';
import { Logger, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AuthGuard } from './Guards/auth.guard';
import { RolesGuard } from './Guards/roles.guard';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GlobalExceptionFilter } from '../Common/Filters/global-exception.filter';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';
import { UsuarioController } from '../Users/usuario.controller';
import { UsuarioService } from '../Users/usuario.service';
import { RolService } from '../Users/rol.service';
import { CicaController } from '../Modules/Cica/cica.controller';
import { CicaService } from '../Modules/Cica/cica.service';
import { CicaExportService } from '../Modules/Cica/cica-export.service';
import { CatequesisBautismoController } from '../Modules/CatequesisBautismo/catequesis-bautismo.controller';
import { CatequesisBautismoService } from '../Modules/CatequesisBautismo/catequesis-bautismo.service';
import { BautismoExportService } from '../Modules/CatequesisBautismo/bautismo-export.service';
import type { Repository } from 'typeorm';
import type { Usuario } from '../Users/Entities/usuario.entity';
import { Role } from '../Common/Enums/Roles';

// JWT, guards, controladores y resolución de permisos reales; sin BD ni usuarios reales.
describe('Permisos vigentes de CICA, Bautismo y Usuarios (HTTP)', () => {
  let app: INestApplication;
  let logError: jest.SpyInstance;
  const jwt = new JwtService({ secret: 'exclusivamente-pruebas' });
  const listar = jest.fn(async () => [{ id: 1, dato: 'privado' }]);
  let permisos: string[];
  let roles: string[];
  const repositorio = {
    findOne: jest.fn(async () => ({ id: 99, email: 'test@example.com', role: Role.USER })),
    manager: { query: jest.fn(async () => roles.map((clave) => ({ clave }))) },
  };
  const rolService = { permisosDeRoles: jest.fn(async () => [...permisos]) };
  const usuarios = new UsuarioService(
    repositorio as unknown as Repository<Usuario>, rolService as unknown as RolService,
  );
  const vigente = jest.spyOn(usuarios, 'credencialesVigentes').mockResolvedValue(true);
  const token = () => jwt.sign({ sub: 99, role: 'limitado', roles: ['limitado'], permisos: ['panel', 'catequesis', 'usuarios'] });

  beforeAll(async () => {
    logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const modulo = await Test.createTestingModule({
      controllers: [CicaController, CatequesisBautismoController, UsuarioController, AuthController],
      providers: [
        { provide: CicaService, useValue: { listar } },
        { provide: CicaExportService, useValue: {} },
        { provide: CatequesisBautismoService, useValue: { listar } },
        { provide: BautismoExportService, useValue: {} },
        { provide: UsuarioService, useValue: { findAll: listar } },
        { provide: AuthService, useValue: { getSessionUser: AuthService.prototype.getSessionUser } },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalGuards(new AuthGuard(jwt, new Reflector(), usuarios), new RolesGuard(new Reflector()));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });
  afterAll(async () => { await app?.close(); logError?.mockRestore(); });
  beforeEach(() => {
    jest.clearAllMocks();
    permisos = ['panel', 'catequesis', 'usuarios'];
    roles = ['limitado'];
    vigente.mockResolvedValue(true);
  });

  describe.each(['/cica', '/catequesis-bautismo', '/usuario'])('%s', (ruta) => {
    const enviar = (jwtActual?: string) => {
      const peticion = request(app.getHttpServer()).get(ruta);
      return jwtActual ? peticion.set('Authorization', `Bearer ${jwtActual}`) : peticion;
    };
    it('sin sesión devuelve 401 sin consultar los datos', async () => {
      await enviar().expect(401);
      expect(listar).not.toHaveBeenCalled();
    });
    it('sin permiso devuelve 403 y no expone datos aunque el JWT lo conserve', async () => {
      permisos = ['panel'];
      const res = await enviar(token()).expect(403);
      expect(listar).not.toHaveBeenCalled();
      expect(JSON.stringify(res.body)).not.toContain('privado');
    });
    it('con permiso permite entrar', async () => {
      await enviar(token()).expect(200);
      expect(listar).toHaveBeenCalledTimes(1);
    });
    it('retirar permiso bloquea al mismo usuario con exactamente el mismo JWT', async () => {
      const anterior = token();
      await enviar(anterior).expect(200);
      permisos = ['panel'];
      listar.mockClear();
      await enviar(anterior).expect(403);
      expect(listar).not.toHaveBeenCalled();
    });
    it('el secretario mantiene acceso total con sus roles vigentes', async () => {
      roles = ['secretario'];
      permisos = [];
      await enviar(token()).expect(200);
    });
    it('retirar el rol de secretario también bloquea un JWT antiguo de administrador', async () => {
      const anterior = jwt.sign({ sub: 99, roles: ['secretario'], permisos: [] });
      permisos = [];
      await enviar(anterior).expect(403);
      expect(listar).not.toHaveBeenCalled();
    });
    it('una sesión invalidada sigue devolviendo 401', async () => {
      vigente.mockResolvedValue(false);
      await enviar(token()).expect(401);
      expect(listar).not.toHaveBeenCalled();
    });
    it.each(['credenciales', 'permisos'])('una caída al consultar %s responde 503, no 401, y no expone datos', async (origen) => {
      const error = Object.assign(new Error('connection terminated'), { code: 'ECONNRESET' });
      if (origen === 'credenciales') vigente.mockRejectedValueOnce(error);
      else rolService.permisosDeRoles.mockRejectedValueOnce(error);
      const res = await enviar(token()).expect(503);
      expect(listar).not.toHaveBeenCalled();
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('privado');
    });
  });

  describe('GET /auth/session', () => {
    it('sin cookie conserva la respuesta pública anónima', async () => {
      const res = await request(app.getHttpServer()).get('/auth/session').expect(200);
      expect(res.body).toEqual({ user: null });
    });
    it('cookie inválida no bloquea la ruta pública', async () => {
      const res = await request(app.getHttpServer()).get('/auth/session')
        .set('Cookie', `${ACCESS_TOKEN_COOKIE}=invalido`).expect(200);
      expect(res.body).toEqual({ user: null });
    });
    it('la misma cookie devuelve los permisos vigentes tras revocarlos', async () => {
      const cookie = `${ACCESS_TOKEN_COOKIE}=${token()}`;
      const antes = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie).expect(200);
      expect(antes.body.user.permisos).toContain('catequesis');
      permisos = ['panel'];
      const despues = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie).expect(200);
      expect(despues.body.user.permisos).toEqual(['panel']);
      expect(despues.body.user.id).toBe(antes.body.user.id);
    });
    it.each(['credenciales', 'permisos'])('fallo temporal de %s no se presenta como sesión anónima ni borra cookies', async (origen) => {
      const error = Object.assign(new Error('connection terminated'), { code: 'ECONNRESET' });
      if (origen === 'credenciales') vigente.mockRejectedValueOnce(error);
      else rolService.permisosDeRoles.mockRejectedValueOnce(error);
      const cookie = `${ACCESS_TOKEN_COOKIE}=${token()}`;
      const res = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie).expect(503);
      expect(res.body).not.toHaveProperty('user');
      expect(res.headers['set-cookie']).toBeUndefined();
      // Al recuperarse el servicio, la misma sesión vuelve a ser válida.
      const recuperada = await request(app.getHttpServer()).get('/auth/session').set('Cookie', cookie).expect(200);
      expect(recuperada.body.user.id).toBe(99);
    });
  });
});
