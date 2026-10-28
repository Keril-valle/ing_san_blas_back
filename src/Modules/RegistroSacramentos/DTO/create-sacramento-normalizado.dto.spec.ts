import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSacramentoNormalizadoDto } from './create-sacramento-normalizado.dto';

const base = {
  tipo: 'bautismo',
  idParroquia: 1,
  fechaSacramento: '2026-01-01',
};

const erroresDe = async (propiedad: string, datos: Record<string, unknown>) => {
  const dto = plainToInstance(CreateSacramentoNormalizadoDto, { ...base, ...datos });
  const errores = await validate(dto);
  return errores.filter((error) => error.property === propiedad);
};

describe('CreateSacramentoNormalizadoDto: texto libre seguro', () => {
  it('acepta observaciones y lugares con acentos y puntuación básica', async () => {
    await expect(
      erroresDe('observaciones', {
        observaciones: 'Nota: bautizo en San José, Costa Rica (parroquia central).',
      }),
    ).resolves.toHaveLength(0);

    await expect(
      erroresDe('bautismo', {
        bautismo: {
          bautizado: { nombre: 'Ana' },
          lugarNacimiento: 'San José, Alajuela - Costa Rica',
        },
      }),
    ).resolves.toHaveLength(0);
  });

  it('rechaza comillas, punto y coma, ángulos y comentarios SQL', async () => {
    await expect(
      erroresDe('observaciones', {
        observaciones: "Robert'); DROP TABLE personas;--",
      }),
    ).resolves.not.toHaveLength(0);

    await expect(
      erroresDe('bautismo', {
        bautismo: {
          bautizado: { nombre: 'Ana' },
          lugarNacimiento: '<script>alert(1)</script>',
        },
      }),
    ).resolves.not.toHaveLength(0);
  });
});
