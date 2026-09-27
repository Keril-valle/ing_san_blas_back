import { CatequesisMailService } from './catequesis-mail.service';
import { MailService } from './mail.service';
import type { SendMailOptions } from '../Interfaces/mail-options.interface';
import type { AvisoInscripcionCatequesis } from './catequesis-mail.service';

const avisoBase: AvisoInscripcionCatequesis = {
  id: 12,
  correo: 'encargado@example.com',
  nombreDestinatario: 'María López',
  nombreCatequizando: 'Juan López',
  centroCatequesis: 'San Blas',
  nivelAInscribirse: 'Primero',
  estado: 'Aprobada',
  observacion: null,
};

describe('CatequesisMailService.notificarEstado', () => {
  const mailService = {
    sendMail: jest.fn<(options: SendMailOptions) => Promise<void>>(),
  };
  const service = new CatequesisMailService(
    mailService as unknown as MailService,
  );
  let ultimoEnvio: SendMailOptions | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    ultimoEnvio = undefined;
    mailService.sendMail.mockImplementation((options: SendMailOptions) => {
      ultimoEnvio = options;
      return Promise.resolve();
    });
  });

  it('avisa la aprobación al correo de quien inscribe', async () => {
    await service.notificarEstado(avisoBase);

    expect(ultimoEnvio?.to).toBe('encargado@example.com');
    expect(ultimoEnvio?.subject).toContain('aprobada');
    expect(ultimoEnvio?.htmlContent).toContain('Juan López');
    expect(ultimoEnvio?.htmlContent).toContain('Primer nivel');
    expect(ultimoEnvio?.htmlContent).toContain('2685-3540');
  });

  it('incluye el motivo cuando la solicitud fue rechazada', async () => {
    await service.notificarEstado({
      ...avisoBase,
      estado: 'Rechazada',
      observacion: 'Falta la fe de bautismo',
    });

    expect(ultimoEnvio?.subject).toContain('rechazada');
    expect(ultimoEnvio?.htmlContent).toContain('Motivo del rechazo');
    expect(ultimoEnvio?.htmlContent).toContain('Falta la fe de bautismo');
    expect(ultimoEnvio?.textContent).toContain('Falta la fe de bautismo');
  });

  it('no envía correo si la inscripción no tiene destinatario', async () => {
    await service.notificarEstado({ ...avisoBase, correo: null });

    expect(mailService.sendMail).not.toHaveBeenCalled();
  });

  it('no lanza si el envío falla', async () => {
    mailService.sendMail.mockRejectedValueOnce(new Error('Brevo caído'));

    await expect(service.notificarEstado(avisoBase)).resolves.toBeUndefined();
  });
});
