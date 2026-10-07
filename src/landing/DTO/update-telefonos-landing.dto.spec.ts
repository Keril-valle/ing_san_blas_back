import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateContactoDto } from './update-contacto.dto';
import { UpdateDonacionesDto } from './update-donaciones.dto';

const contactoValido = {
  eyebrow: 'Contacto',
  title: 'Contacto',
  intro: 'Texto de introducción.',
  telefono: '8888-8888',
  correo: 'parroquia@example.com',
  ubicacion: 'San Ramón',
  horariosAtencion: ['Lunes :: 8:00 - 12:00'],
  mapaUrl: 'https://maps.google.com/maps?q=San+Blas&output=embed',
};

const donacionesValido = {
  title: 'Donaciones',
  intro: 'Texto de introducción.',
  sinpe: '88888888',
  cuentaBancaria: 'CR67015100012345678901',
  banco: 'Banco Nacional',
};

const validarContacto = async (telefono: string) => {
  const dto = plainToInstance(UpdateContactoDto, {
    ...contactoValido,
    telefono,
  });
  return validate(dto, { whitelist: true });
};

const validarDonaciones = async (sinpe: string) => {
  const dto = plainToInstance(UpdateDonacionesDto, {
    ...donacionesValido,
    sinpe,
  });
  return validate(dto, { whitelist: true });
};

describe('Teléfonos del landing que empiezan con 0', () => {
  it('rechaza el teléfono de contacto que empieza con 0', async () => {
    for (const telefono of ['0888-8888', '005068888888', '0']) {
      const errores = await validarContacto(telefono);
      expect(errores).toHaveLength(1);
      expect(errores[0].property).toBe('telefono');
      expect(errores[0].constraints?.matches).toBe(
        'El número no puede empezar con 0.',
      );
    }
  });

  it('rechaza el SINPE que empieza con 0', async () => {
    for (const sinpe of ['08888888', '005068888888']) {
      const errores = await validarDonaciones(sinpe);
      expect(errores).toHaveLength(1);
      expect(errores[0].property).toBe('sinpe');
      expect(errores[0].constraints?.matches).toBe(
        'El número no puede empezar con 0.',
      );
    }
  });

  it('acepta prefijo +506 y números sin cero inicial', async () => {
    expect(await validarContacto('+506 8888-8888')).toHaveLength(0);
    expect(await validarContacto('2685-3540')).toHaveLength(0);
    expect(await validarDonaciones('8888-1234')).toHaveLength(0);
    expect(await validarDonaciones('88888888')).toHaveLength(0);
  });

  it('recorta espacios antes de validar', async () => {
    const errores = await validarContacto(' 0888-8888');
    expect(errores).toHaveLength(1);
    expect(errores[0].constraints?.matches).toBe(
      'El número no puede empezar con 0.',
    );
  });
});
