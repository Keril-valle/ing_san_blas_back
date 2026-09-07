import { DonacionMailService } from './donacion-mail.service';
import { MailService } from './mail.service';
import { Donacion } from '../../Modules/Donaciones/Entities/donacion.entity';
import type { SendMailOptions } from '../Interfaces/mail-options.interface';

describe('DonacionMailService.notificarEstado', () => {
  const mailService = {
    sendMail: jest.fn<(options: SendMailOptions) => Promise<void>>(),
  };
  const service = new DonacionMailService(
    mailService as unknown as MailService,
  );

  const donacionAprobada: Donacion = {
    id: 7,
    fecha: new Date('2026-09-01T00:00:00.000Z'),
    anonimo: false,
    nombre: 'Ana Pérez',
    correo: 'ana@example.com',
    telefono: '8888-8888',
    detalle: 'Arroz y aceite',
    estado: 'Aprobado',
    detalleAprobacion: 'Entregar en portería el lunes',
  };

  let ultimoEnvio: SendMailOptions | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    ultimoEnvio = undefined;
    mailService.sendMail.mockImplementation((options: SendMailOptions) => {
      ultimoEnvio = options; // guardamos lo que se iba a mandar para revisarlo en los expects
      return Promise.resolve();
    });
  });

  it('incluye el comentario de aprobación en el correo', async () => {
    await service.notificarEstado(donacionAprobada);

    expect(ultimoEnvio?.htmlContent).toContain('Comentario de la parroquia');
    expect(ultimoEnvio?.htmlContent).toContain('Entregar en portería el lunes');
    expect(ultimoEnvio?.textContent).toContain('Entregar en portería el lunes');
  });

  it('omite el bloque de comentario si no hubo detalle al aprobar', async () => {
    await service.notificarEstado({
      ...donacionAprobada,
      detalleAprobacion: undefined,
    });

    expect(ultimoEnvio?.htmlContent).not.toContain(
      'Comentario de la parroquia',
    );
  });

  it('no lanza si el envío falla', async () => {
    mailService.sendMail.mockRejectedValueOnce(new Error('Brevo caído'));

    await expect(
      service.notificarEstado(donacionAprobada),
    ).resolves.toBeUndefined();
  });
});
