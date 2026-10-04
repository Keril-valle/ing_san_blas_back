import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

const configConClave = (apiKey?: string) =>
  ({
    get: jest.fn((clave: string) =>
      clave === 'BREVO_API_KEY' ? apiKey : undefined,
    ),
  }) as unknown as ConfigService;

const opciones = {
  to: 'feligres@ejemplo.com',
  subject: 'Asunto de prueba',
  htmlContent: '<p>Hola</p>',
};

describe('MailService', () => {
  it('omite el envío sin lanzar cuando falta BREVO_API_KEY', async () => {
    const service = new MailService(configConClave(undefined));

    await expect(service.sendMail(opciones)).resolves.toBeUndefined();
  });

  it('acota la llamada a Brevo a 15 s (el navegador rinde a los 30)', () => {
    const service = new MailService(configConClave('una-clave'));

    const cliente = (
      service as unknown as {
        obtenerCliente: () => {
          _options?: { timeoutInSeconds?: number };
        } | null;
      }
    ).obtenerCliente();

    expect(cliente?._options?.timeoutInSeconds).toBe(15);
  });

  it('propaga el fallo de Brevo conservando su mensaje', async () => {
    const service = new MailService(configConClave(undefined));
    const fallo = new Error('Brevo caído');
    const clientFalso = {
      transactionalEmails: {
        sendTransacEmail: jest.fn().mockRejectedValue(fallo),
      },
    };
    (
      service as unknown as {
        client: typeof clientFalso;
      }
    ).client = clientFalso;

    await expect(service.sendMail(opciones)).rejects.toThrow('Brevo caído');
    expect(clientFalso.transactionalEmails.sendTransacEmail).toHaveBeenCalled();
  });
});
