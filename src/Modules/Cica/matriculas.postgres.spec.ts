import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { AuthGuard } from '../../Auth/Guards/auth.guard';
import { RolesGuard } from '../../Auth/Guards/roles.guard';
import { UsuarioService } from '../../Users/usuario.service';
import { CicaModule } from './cica.module';
import { CatequesisBautismoModule } from '../CatequesisBautismo/catequesis-bautismo.module';
import { InscripcionCica } from './Entities/inscripcion-cica.entity';
import { InscripcionCatequesisBautismo } from '../CatequesisBautismo/Entities/inscripcion-catequesis-bautismo.entity';
import { UnicidadMatriculasPendientes1793180000000 } from '../../migrations/1793180000000-UnicidadMatriculasPendientes';
import { CreateInscripcionCica1788000000031 } from '../../migrations/1788000000031-CreateInscripcionCica';
import { CreateInscripcionCatequesisBautismo1788000000032 } from '../../migrations/1788000000032-CreateInscripcionCatequesisBautismo';
import { SplitNombreConyugeCica1788000000033 } from '../../migrations/1788000000033-SplitNombreConyugeCica';
import { LimitarTextosCica1788000000034 } from '../../migrations/1788000000034-LimitarTextosCica';
import { LimitarDireccionCica1788000000035 } from '../../migrations/1788000000035-LimitarDireccionCica';
import { LimitarTextosCatequesisBautismo1788000000036 } from '../../migrations/1788000000036-LimitarTextosCatequesisBautismo';
import { AddUbicacionInscripcionCica1788000000039 } from '../../migrations/1788000000039-AddUbicacionInscripcionCica';
import { AddNacionalidadCatequesisBautismo1788000000041 } from '../../migrations/1788000000041-AddNacionalidadCatequesisBautismo';

// Solo se ejecuta contra una BD local explícita; nunca usa DATABASE_URL del .env.
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
suite('matrículas con PostgreSQL real', () => {
  let db: DataSource;
  let app: INestApplication;
  let token: string;
  let sinPermiso: string;
  const schema = `sprint4_${Date.now()}`;
  const cica = {
    tipoCedula: 'nacional',
    cedula: '123456789',
    nombre: 'Ana',
    apellido1: 'Pérez',
    fechaNacimiento: '1990-01-01',
    nacionalidad: 'Costarricense',
    telefono: '8888-8888',
    correo: 'ana@example.test',
    estadoCivil: 'soltero',
    necesitaBautizo: true,
    necesitaPrimeraComunion: false,
    necesitaConfirmacion: false,
    padreNombre: 'Juan',
    padreApellido1: 'Pérez',
    madreNombre: 'María',
    madreApellido1: 'Solís',
    provincia: 'Guanacaste',
    canton: 'Nicoya',
    distrito: 'Nicoya',
    direccionHogar: 'Frente al parque central',
    esCatolico: true,
  };
  const bautismo = {
    tipoCedula: 'nacional',
    cedula: '123456789',
    nombre: 'Ana',
    apellido1: 'Pérez',
    fechaNacimiento: '1990-01-01',
    nacionalidad: 'Costarricense',
    telefono: '8888-8888',
    estadoCivil: 'soltero',
    parroquiaOrigen: 'San Blas',
    provincia: 'Guanacaste',
    canton: 'Nicoya',
    distrito: 'Nicoya',
    barrio: 'Centro',
    condicion: 'padre_madre',
  };

  beforeAll(async () => {
    if (!url || !['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
      throw new Error('Las pruebas requieren PostgreSQL local.');
    const admin = await new DataSource({
      type: 'postgres',
      url,
      ssl: false,
    }).initialize();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    await admin.destroy();
    db = await new DataSource({
      type: 'postgres',
      url,
      schema,
      ssl: false,
      extra: { options: `-c search_path=${schema}` },
      entities: [InscripcionCica, InscripcionCatequesisBautismo],
      migrations: [
        CreateInscripcionCica1788000000031,
        CreateInscripcionCatequesisBautismo1788000000032,
        SplitNombreConyugeCica1788000000033,
        LimitarTextosCica1788000000034,
        LimitarDireccionCica1788000000035,
        LimitarTextosCatequesisBautismo1788000000036,
        AddUbicacionInscripcionCica1788000000039,
        AddNacionalidadCatequesisBautismo1788000000041,
        UnicidadMatriculasPendientes1793180000000,
      ],
    }).initialize();
    await db.runMigrations({ transaction: 'all' });
    const secret = randomBytes(32).toString('hex');
    const modulo = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url,
          schema,
          ssl: false,
          extra: { options: `-c search_path=${schema}` },
          entities: [InscripcionCica, InscripcionCatequesisBautismo],
        }),
        JwtModule.register({ secret }),
        CicaModule,
        CatequesisBautismoModule,
      ],
      providers: [
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
    const jwt = modulo.get(JwtService);
    token = jwt.sign({ sub: 9, permisos: ['catequesis'] });
    sinPermiso = jwt.sign({ sub: 10, permisos: [] });
  }, 60000);

  afterAll(async () => {
    await app?.close();
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  beforeEach(async () => {
    await db.query(
      'TRUNCATE inscripcion_cica, inscripcion_catequesis_bautismo RESTART IDENTITY',
    );
  });

  for (const [ruta, datos] of [
    ['/cica', cica],
    ['/catequesis-bautismo', bautismo],
  ] as const) {
    it(`${ruta}: protege acceso y valida parámetros`, async () => {
      await request(app.getHttpServer()).get(ruta).expect(401);
      await request(app.getHttpServer())
        .get(ruta)
        .auth(sinPermiso, { type: 'bearer' })
        .expect(403);
      for (const query of [
        { limit: 101 },
        { page: -1 },
        { page: 'NaN' },
        { estado: 'inventado' },
        { desconocido: 1 },
      ]) {
        await request(app.getHttpServer())
          .get(ruta)
          .query(query)
          .auth(token, { type: 'bearer' })
          .expect(400);
      }
    });
    it(`${ruta}: concurrencia, revisión, reinscripción y contrato legado`, async () => {
      const resultados = await Promise.all([
        request(app.getHttpServer()).post(ruta).send(datos),
        request(app.getHttpServer()).post(ruta).send(datos),
      ]);
      expect(resultados.map((r) => r.status).sort()).toEqual([201, 409]);
      const id = resultados.find((r) => r.status === 201)!.body.id as number;
      await request(app.getHttpServer())
        .put(`${ruta}/${id}/estado`)
        .auth(token, { type: 'bearer' })
        .send({
          estado: 'Rechazada',
          observacionAdministrativa: 'Datos incompletos',
        })
        .expect(200);
      await request(app.getHttpServer()).post(ruta).send(datos).expect(201);
      const legado = await request(app.getHttpServer())
        .get(ruta)
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(Array.isArray(legado.body)).toBe(true);
      const pagina = await request(app.getHttpServer())
        .get(ruta)
        .query({ page: 1, limit: 1, busqueda: 'Ana' })
        .auth(token, { type: 'bearer' })
        .expect(200);
      expect(pagina.body).toMatchObject({
        total: 1,
        page: 1,
        limit: 1,
        totales: { pendientes: 1, rechazadas: 1, aprobadas: 0 },
      });
      expect(pagina.body.data).toHaveLength(1);
    });
    it(`${ruta}: filtra y pagina sin duplicar ni perder registros`, async () => {
      for (let i = 0; i < 12; i++)
        await request(app.getHttpServer())
          .post(ruta)
          .send({
            ...datos,
            cedula: `${123456780 + i}`,
            nombre: i < 11 ? 'Ana' : 'Luis',
          })
          .expect(201);
      const consulta = (query: object) =>
        request(app.getHttpServer())
          .get(ruta)
          .query(query)
          .auth(token, { type: 'bearer' });
      const primera = await consulta({ page: 1, limit: 10 });
      const segunda = await consulta({ page: 2, limit: 10 });
      expect(primera.body.total).toBe(12);
      expect(primera.body.data).toHaveLength(10);
      expect(segunda.body.data).toHaveLength(2);
      expect(
        new Set(
          [...primera.body.data, ...segunda.body.data].map(
            (fila: { id: number }) => fila.id,
          ),
        ).size,
      ).toBe(12);
      expect((await consulta({ page: 1, nombre: 'Luis' })).body.total).toBe(1);
      expect(
        (await consulta({ page: 1, cedula: '123456791' })).body.total,
      ).toBe(1);
      expect((await consulta({ page: 1, busqueda: '%' })).body.total).toBe(0);
      const especifico =
        ruta === '/cica'
          ? { sacramento: 'confirmacion' }
          : { condicion: 'padrino_madrina' };
      expect((await consulta({ page: 1, ...especifico })).body.total).toBe(0);
      expect((await consulta({ page: 99, limit: 10 })).body.data).toHaveLength(
        0,
      );
    });
  }

  it('CICA rechaza provincia/cantón/distrito incompatibles sin guardar', async () => {
    await request(app.getHttpServer())
      .post('/cica')
      .send({ ...cica, canton: 'Liberia' })
      .expect(400);
    expect(await db.getRepository(InscripcionCica).count()).toBe(0);
  });

  it('rollback y nueva aplicación conservan registros; los duplicados previos abortan sin borrarlos', async () => {
    const repo = db.getRepository(InscripcionCica);
    await request(app.getHttpServer()).post('/cica').send(cica).expect(201);
    await db.undoLastMigration({ transaction: 'all' });
    expect(await repo.count()).toBe(1);
    await request(app.getHttpServer()).post('/cica').send(cica).expect(201);
    await expect(db.runMigrations({ transaction: 'all' })).rejects.toThrow(
      'duplicadas',
    );
    expect(await repo.count()).toBe(2);
    const duplicada = await repo.find({ order: { id: 'DESC' }, take: 1 });
    await repo.update(duplicada[0].id, { estado: 'Rechazada' });
    await db.runMigrations({ transaction: 'all' });
    expect(await repo.count()).toBe(2);
    await request(app.getHttpServer()).post('/cica').send(cica).expect(409);
  });
});
