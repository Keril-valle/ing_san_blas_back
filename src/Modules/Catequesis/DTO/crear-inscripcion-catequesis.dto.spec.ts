// reflect-metadata hay que cargarlo antes que los decoradores de class-validator/transformer
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  DatosCatequizandoDto,
  DatosMadreDto,
} from './crear-inscripcion-catequesis.dto';

const direccion = (cantidad: number) => 'A'.repeat(cantidad);

const catequizandoCon = (valor: string) =>
  plainToInstance(DatosCatequizandoDto, {
    nombre: 'Prueba',
    primerApellido: 'Registro',
    fechaNacimiento: '2012-04-15',
    direccionExacta: valor,
  });

const madreCon = (valor: string) =>
  plainToInstance(DatosMadreDto, {
    nombre: 'Encargada',
    primerApellido: 'Prueba',
    direccionExacta: valor,
    ciudad: 'San Blas',
    provincia: 'Guanacaste',
    telefono: '8888-8888',
  });

const errorDeDireccion = async (dto: object) => {
  const errores = await validate(dto);
  return errores.find((error) => error.property === 'direccionExacta');
};

describe('Límite de 150 caracteres en dirección exacta', () => {
  it('acepta 150 caracteres en la dirección del catequizando', async () => {
    await expect(
      errorDeDireccion(catequizandoCon(direccion(150))),
    ).resolves.toBeUndefined();
  });

  it('rechaza 151 caracteres en la dirección del catequizando', async () => {
    const error = await errorDeDireccion(catequizandoCon(direccion(151)));
    expect(error?.constraints?.maxLength).toBe(
      'La dirección exacta no puede superar 150 caracteres.',
    );
  });

  it('acepta 150 y rechaza 151 en la dirección de la madre o encargada', async () => {
    await expect(
      errorDeDireccion(madreCon(direccion(150))),
    ).resolves.toBeUndefined();
    const error = await errorDeDireccion(madreCon(direccion(151)));
    expect(error?.constraints?.maxLength).toBe(
      'La dirección exacta no puede superar 150 caracteres.',
    );
  });
});
