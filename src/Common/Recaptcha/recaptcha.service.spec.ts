import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecaptchaService } from './recaptcha.service';

describe('RecaptchaService', () => {
  let service: RecaptchaService;
  let fetchMock: jest.SpyInstance;
  let configuracion: Record<string, string>;

  // Simula Google y la configuración; no usa claves ni peticiones reales.
  beforeEach(() => {
    configuracion = {
      RECAPTCHA_SECRET_KEY: 'clave-ficticia-para-pruebas',
      FRONTEND_URL: 'https://parroquiasanblas.org',
    };
    const config = {
      get: (clave: string) => configuracion[clave],
    } as unknown as ConfigService;
    service = new RecaptchaService(config);
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, hostname: 'parroquiasanblas.org' }),
        ),
      );
  });

  // Restaura fetch para que ninguna otra suite herede esta simulación.
  afterEach(() => jest.restoreAllMocks());

  it('consulta Google por POST y acepta un token del dominio configurado', async () => {
    await expect(service.verificar('token-de-prueba')).resolves.toBeUndefined();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://www.google.com/recaptcha/api/siteverify');
    expect(options.method).toBe('POST');
    expect(options.redirect).toBe('error');
    expect(options.body.get('response')).toBe('token-de-prueba');
    expect(options.body.get('secret')).toBe(configuracion.RECAPTCHA_SECRET_KEY);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([undefined, null, '', '   ', 123, {}, 'a'.repeat(4097)])(
    'rechaza un token ausente o mal formado sin contactar Google (%p)',
    async (token) => {
      await expect(service.verificar(token)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each(['invalid-input-response', 'timeout-or-duplicate'])(
    'rechaza tokens inválidos, vencidos o reutilizados (%s)',
    async (codigo) => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            'error-codes': [codigo],
          }),
        ),
      );
      await expect(service.verificar('token-rechazado')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it.each(['otro.example', 'parroquiasanblas.org.atacante.example', undefined])(
    'rechaza un hostname ajeno o ausente (%p)',
    async (hostname) => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, hostname })),
      );
      await expect(service.verificar('token-de-prueba')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    },
  );

  it('respeta la lista explícita y no acepta un dominio por coincidencia parcial', async () => {
    configuracion.RECAPTCHA_ALLOWED_HOSTNAMES =
      ' localhost, parroquiasanblas.org ';
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, hostname: 'localhost' })),
    );
    await expect(service.verificar('token-local')).resolves.toBeUndefined();
  });

  it('no habilita localhost por defecto cuando falta FRONTEND_URL', async () => {
    delete configuracion.FRONTEND_URL;
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, hostname: 'localhost' })),
    );
    await expect(service.verificar('token-local')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('sin secreto falla cerrado y no contacta Google', async () => {
    configuracion.RECAPTCHA_SECRET_KEY = '  ';
    await expect(service.verificar('token-de-prueba')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['missing-input-secret', 'invalid-input-secret'])(
    'presenta una configuración inválida como indisponibilidad (%s)',
    async (codigo) => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ success: false, 'error-codes': [codigo] }),
        ),
      );
      await expect(service.verificar('token-de-prueba')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    },
  );

  it.each(['timeout', 'red', 'http', 'json', 'null'])(
    'falla cerrado y no filtra detalles ante un error de %s',
    async (tipo) => {
      if (tipo === 'http')
        fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
      else if (tipo === 'json')
        fetchMock.mockResolvedValueOnce(new Response('no es json'));
      else if (tipo === 'null')
        fetchMock.mockResolvedValueOnce(new Response('null'));
      else
        fetchMock.mockRejectedValueOnce(
          new Error('detalle interno con datos sensibles'),
        );
      await expect(service.verificar('token-de-prueba')).rejects.toMatchObject({
        status: 503,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1); // sin reintentos que consuman de nuevo el token
    },
  );

  it('no cachea éxitos: verifica cada envío y Google rechaza la reutilización', async () => {
    await service.verificar('mismo-token');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          'error-codes': ['timeout-or-duplicate'],
        }),
      ),
    );
    await expect(service.verificar('mismo-token')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
