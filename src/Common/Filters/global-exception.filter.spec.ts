import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { GlobalExceptionFilter } from './global-exception.filter';

type Captura = { codigo?: number; cuerpo?: Record<string, unknown> };

const atrapar = (exception: unknown): Captura => {
  const captura: Captura = {};

  const host = {
    switchToHttp: () => ({
      getResponse: () => ({
        status: (codigo: number) => {
          captura.codigo = codigo;
          return {
            json: (cuerpo: unknown) => {
              captura.cuerpo = cuerpo as Record<string, unknown>;
            },
          };
        },
      }),
      getRequest: () => ({ method: 'GET', url: '/prueba' }),
    }),
  } as unknown as ArgumentsHost;

  new GlobalExceptionFilter().catch(exception, host);
  return captura;
};

describe('GlobalExceptionFilter', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve el mensaje amigable de un HttpException', () => {
    const { codigo, cuerpo } = atrapar(
      new NotFoundException({ mensaje: 'No encontramos esa inscripción.' }),
    );

    expect(codigo).toBe(404);
    expect(cuerpo?.statusCode).toBe(404);
    expect(cuerpo?.mensaje).toBe('No encontramos esa inscripción.');
    expect(cuerpo?.errores).toBeUndefined();
    expect(cuerpo?.timestamp).toBeDefined();
  });

  it('traduce al español los mensajes por defecto del framework', () => {
    const sinSesion = atrapar(new UnauthorizedException());
    expect(sinSesion.codigo).toBe(401);
    expect(String(sinSesion.cuerpo?.mensaje)).toContain('autorizado');

    const sinPermisos = atrapar(new ForbiddenException());
    expect(sinPermisos.codigo).toBe(403);
    expect(String(sinPermisos.cuerpo?.mensaje)).toContain('permisos');

    const inexistente = atrapar(new NotFoundException());
    expect(inexistente.codigo).toBe(404);
    expect(String(inexistente.cuerpo?.mensaje)).toContain('encontrado');
  });

  it('responde 404 en español cuando Express no encuentra la ruta', () => {
    const { codigo, cuerpo } = atrapar(
      new NotFoundException('Cannot GET /ruta'),
    );

    expect(codigo).toBe(404);
    expect(cuerpo?.mensaje).toBe('El recurso solicitado no fue encontrado.');
  });

  it('no filtra mensajes técnicos al usuario', () => {
    const { codigo, cuerpo } = atrapar(
      new BadRequestException('syntax error at line 1'),
    );

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).not.toMatch(/syntax error|sql|typeorm/i);
  });

  it('responde en español cuando el body no es JSON válido', () => {
    const { codigo, cuerpo } = atrapar(
      new BadRequestException(
        "Expected property name or '}' in JSON at position 1 (line 1 column 2)",
      ),
    );

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).not.toMatch(/JSON|position/i);
    expect(String(cuerpo?.mensaje)).toContain('Los datos enviados');
  });

  it('responde en español cuando ParseIntPipe rechaza el id de la ruta', () => {
    const { codigo, cuerpo } = atrapar(
      new BadRequestException('Validation failed (numeric string is expected)'),
    );

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).not.toMatch(/validation failed|numeric/i);
    expect(String(cuerpo?.mensaje)).toContain('Los datos enviados');
  });

  it('no muestra errores técnicos de JavaScript como mensaje de usuario', () => {
    const { codigo, cuerpo } = atrapar(
      new BadRequestException({
        mensaje: "Cannot read properties of undefined (reading 'datosPago')",
      }),
    );

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).not.toMatch(/cannot read|undefined/i);
    expect(cuerpo?.mensaje).toBe(
      'Los datos enviados no son válidos. Revise e intente de nuevo.',
    );
  });

  it('propaga el detalle de errores por campo', () => {
    const { cuerpo } = atrapar(
      new BadRequestException({
        mensaje: 'Datos inválidos.',
        errores: { correo: ['El correo no es válido.'] },
      }),
    );

    expect(cuerpo?.errores).toEqual({
      correo: ['El correo no es válido.'],
    });
  });

  it('un fallo de la base responde 503 sin exponer el SQL', () => {
    const { codigo, cuerpo } = atrapar(
      new QueryFailedError(
        'SELECT * FROM "Inscripcion"',
        [],
        new Error('boom'),
      ),
    );

    expect(codigo).toBe(503);
    expect(String(cuerpo?.mensaje)).not.toMatch(/select|typeorm|boom/i);
  });

  it('un error de conexión responde 503', () => {
    const error = Object.assign(new Error('connect ECONNREFUSED'), {
      code: 'ECONNREFUSED',
    });

    const { codigo } = atrapar(error);

    expect(codigo).toBe(503);
  });

  it('un archivo que supera el límite responde 400 con el mensaje de 5 MB', () => {
    const multer = Object.assign(new Error('File too large'), {
      name: 'MulterError',
      code: 'LIMIT_FILE_SIZE',
    });

    const { codigo, cuerpo } = atrapar(multer);

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).toContain('5 MB');
  });

  it('un cuerpo que supera el límite responde 413 en español', () => {
    const cuerpoGrande = Object.assign(new Error('request entity too large'), {
      status: 413,
      statusCode: 413,
      type: 'entity.too.large',
      expose: true,
    });

    const { codigo, cuerpo } = atrapar(cuerpoGrande);

    expect(codigo).toBe(413);
    expect(String(cuerpo?.mensaje)).toContain('demasiado grande');
    expect(String(cuerpo?.mensaje)).not.toMatch(/entity|too large/i);
  });

  it('un error de body-parser distinto al tamaño responde 400 en español', () => {
    const parseo = Object.assign(new SyntaxError('Unexpected end of JSON'), {
      status: 400,
      statusCode: 400,
      type: 'entity.parse.failed',
      expose: true,
    });

    const { codigo, cuerpo } = atrapar(parseo);

    expect(codigo).toBe(400);
    expect(String(cuerpo?.mensaje)).toContain('Los datos enviados');
    expect(String(cuerpo?.mensaje)).not.toMatch(/unexpected|json/i);
  });

  it('cualquier otro error responde 500 con mensaje genérico', () => {
    const { codigo, cuerpo } = atrapar(new Error('algo inesperado'));

    expect(codigo).toBe(500);
    expect(String(cuerpo?.mensaje)).not.toContain('algo inesperado');
  });
});
