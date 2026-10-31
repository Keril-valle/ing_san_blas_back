import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { Workbook } from 'exceljs';
import { And, LessThan, MoreThanOrEqual } from 'typeorm';
import { CicaController } from './cica.controller';
import { CicaService } from './cica.service';
import { CicaExportService } from './cica-export.service';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import { CatequesisBautismoController } from '../CatequesisBautismo/catequesis-bautismo.controller';
import { CatequesisBautismoService } from '../CatequesisBautismo/catequesis-bautismo.service';
import { BautismoExportService } from '../CatequesisBautismo/bautismo-export.service';
import { InscripcionCatequesisBautismo } from '../CatequesisBautismo/Entities/inscripcion-catequesis-bautismo.entity';
import { AuthGuard } from '../../Auth/Guards/auth.guard';
import { RolesGuard } from '../../Auth/Guards/roles.guard';
import { UsuarioService } from '../../Users/usuario.service';

// Captura el binario sin transformarlo en texto, igual que la descarga del navegador.
const binario = (
  res: IncomingMessage,
  callback: (error: Error | null, data?: Buffer) => void,
) => {
  const partes: Buffer[] = [];
  res.on('data', (parte: Buffer) => partes.push(parte));
  res.on('end', () => callback(null, Buffer.concat(partes)));
  res.on('error', callback);
};

describe('exportaciones HTTP protegidas', () => {
  let app: INestApplication;
  let token: string;
  let sinPermiso: string;
  const find = jest.fn();

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [
        JwtModule.register({ secret: randomBytes(32).toString('hex') }),
      ],
      controllers: [CicaController, CatequesisBautismoController],
      providers: [
        CicaExportService,
        BautismoExportService,
        { provide: CicaService, useValue: {} },
        { provide: CatequesisBautismoService, useValue: {} },
        { provide: getRepositoryToken(InscripcionCica), useValue: { find } },
        {
          provide: getRepositoryToken(InscripcionCatequesisBautismo),
          useValue: { find },
        },
        {
          provide: UsuarioService,
          useValue: { credencialesVigentes: () => Promise.resolve(true) },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    }).compile();
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    token = modulo.get(JwtService).sign({ sub: 1, permisos: ['catequesis'] });
    sinPermiso = modulo.get(JwtService).sign({ sub: 2, permisos: [] });
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    find.mockReset().mockResolvedValue([
      {
        nombre: 'Prueba',
        apellido1: 'Local',
        cedula: '012345678901',
        estado: 'Pendiente',
        fechaSolicitud: new Date(),
        necesitaBautizo: true,
        condicion: 'padre_madre',
      },
    ]);
  });

  for (const ruta of ['/cica/exportar', '/catequesis-bautismo/exportar']) {
    it(`${ruta}: requiere sesión y permiso de catequesis`, async () => {
      await request(app.getHttpServer()).get(ruta).expect(401);
      await request(app.getHttpServer())
        .get(ruta)
        .auth(sinPermiso, { type: 'bearer' })
        .expect(403);
      expect(find).not.toHaveBeenCalled();
    });
    it(`${ruta}: devuelve XLSX válido y no confunde exportar con :id`, async () => {
      const respuesta = await request(app.getHttpServer())
        .get(ruta)
        .auth(token, { type: 'bearer' })
        .buffer(true)
        .parse(binario)
        .expect(200);
      expect(respuesta.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(respuesta.headers['content-disposition']).toMatch(
        /^attachment; filename="inscripciones_.*\.xlsx"$/,
      );
      expect(respuesta.headers['cache-control']).toBe('no-store');
      const libro = new Workbook();
      await libro.xlsx.load(respuesta.body as Buffer);
      expect(libro.worksheets[0].getCell('D6').value).toBe('012345678901');
    });
    it(`${ruta}: rechaza filtros inválidos y paginación, antes de consultar`, async () => {
      const especifico = ruta.startsWith('/cica/')
        ? { sacramento: 'bautizo' }
        : { condicion: 'padre_madre' };
      for (const query of [
        { estado: 'otro' },
        { page: 2 },
        { limit: 10 },
        { vista: 'historial' },
        especifico,
        { desde: '2026-02-30' },
        { hasta: '2026-13-01' },
        { desde: '28/10/2026' },
        { desde: '2026-10-28T00:00:00Z' },
        { desde: ['2026-10-01', '2026-10-28'] },
        { desde: '2026-10-28', hasta: '2026-10-01' },
      ]) {
        await request(app.getHttpServer())
          .get(ruta)
          .query(query)
          .auth(token, { type: 'bearer' })
          .expect(400);
      }
      expect(find).not.toHaveBeenCalled();
    });
    it(`${ruta}: valida y aplica el rango completo en horario de Costa Rica`, async () => {
      await request(app.getHttpServer())
        .get(ruta)
        .query({
          desde: '2026-10-28',
          hasta: '2026-10-28',
          estado: 'Pendiente',
        })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(find).toHaveBeenCalledWith({
        where: {
          estado: 'Pendiente',
          fechaSolicitud: And(
            MoreThanOrEqual(new Date('2026-10-28T06:00:00Z')),
            LessThan(new Date('2026-10-29T06:00:00Z')),
          ),
        },
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
    });
    it(`${ruta}: «todos» no limita al estado pendiente`, async () => {
      await request(app.getHttpServer())
        .get(ruta)
        .query({ estado: 'todos' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(find).toHaveBeenCalledWith({
        where: {},
        order: { fechaSolicitud: 'DESC', id: 'DESC' },
      });
    });
    it(`${ruta}: sin resultados responde 404 en lugar de descargar un Excel vacío`, async () => {
      find.mockResolvedValue([]);
      const respuesta = await request(app.getHttpServer())
        .get(ruta)
        .auth(token, { type: 'bearer' })
        .expect(404);
      expect(respuesta.body.mensaje).toContain('filtros seleccionados');
      expect(respuesta.headers['content-disposition']).toBeUndefined();
    });
    it(`${ruta}: no expone el error interno si falla la base`, async () => {
      find.mockRejectedValue(new Error('detalle interno de PostgreSQL'));
      const respuesta = await request(app.getHttpServer())
        .get(ruta)
        .auth(token, { type: 'bearer' })
        .expect(500);
      expect(respuesta.body.mensaje).toBe(
        'No se pudo generar el archivo de exportación.',
      );
      expect(JSON.stringify(respuesta.body)).not.toContain('PostgreSQL');
    });
  }
});
