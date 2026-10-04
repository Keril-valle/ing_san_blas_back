import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  validate,
} from 'class-validator';
import {
  mapValidationErrors,
  traducirMensajeValidacion,
} from './validation-errors';

enum EstadoPrueba {
  PENDIENTE = 'Pendiente',
  APROBADO = 'Aprobado',
}

class PayloadPrueba {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido.' })
  titulo: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de correo inválido.' })
  correo?: string;

  @IsOptional()
  @MaxLength(5, { message: 'El detalle es muy largo.' })
  detalle?: string;

  @IsOptional()
  @Min(1, { message: 'La página debe ser mayor a 0.' })
  page?: number;

  @IsEnum(EstadoPrueba)
  estado: EstadoPrueba;
}

// espejo del DTO de recuperación: cuatro validadores con el mismo texto
class TokenPrueba {
  @IsString()
  @IsNotEmpty({ message: 'El enlace de recuperación no es válido.' })
  @MinLength(43, { message: 'El enlace de recuperación no es válido.' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'El enlace de recuperación no es válido.',
  })
  token: string;
}

describe('traducirMensajeValidacion', () => {
  it('traduce los mensajes por defecto de class-validator', () => {
    expect(
      traducirMensajeValidacion(
        'cedula must be longer than or equal to 9 characters',
      ),
    ).toBe('cedula debe tener al menos 9 caracteres');

    expect(
      traducirMensajeValidacion(
        'descripcion must be shorter than or equal to 250 characters',
      ),
    ).toBe('descripcion debe tener como máximo 250 caracteres');

    expect(traducirMensajeValidacion('titulo must be a string')).toBe(
      'titulo debe ser un texto',
    );

    expect(traducirMensajeValidacion('correo must be an email')).toBe(
      'correo debe ser un correo válido',
    );

    expect(traducirMensajeValidacion('nombre should not be empty')).toBe(
      'nombre no puede estar vacío',
    );

    expect(
      traducirMensajeValidacion(
        'estado must be one of the following values: Pendiente, Aprobado',
      ),
    ).toBe(
      'estado debe ser uno de los siguientes valores: Pendiente, Aprobado',
    );

    expect(traducirMensajeValidacion('page must not be less than 1')).toBe(
      'page debe ser mayor o igual a 1',
    );
  });

  it('deja intactos los mensajes que no reconoce', () => {
    expect(traducirMensajeValidacion('Algo totalmente distinto')).toBe(
      'Algo totalmente distinto',
    );
  });
});

describe('mapValidationErrors', () => {
  it('devuelve todos los mensajes en español', async () => {
    const dto = plainToInstance(PayloadPrueba, {
      titulo: '',
      correo: 'no-es-correo',
      detalle: 'demasiado largo',
      page: 0,
      estado: 'Otro',
    });

    const errores = await validate(dto, { whitelist: true });
    const respuesta = mapValidationErrors(errores);

    expect(respuesta.errores.titulo).toContain('El título es requerido.');
    expect(respuesta.errores.correo).toEqual(['Formato de correo inválido.']);
    expect(respuesta.errores.detalle).toEqual(['El detalle es muy largo.']);
    expect(respuesta.errores.page).toEqual(['La página debe ser mayor a 0.']);
    expect(respuesta.errores.estado).toEqual([
      'estado debe ser uno de los siguientes valores: Pendiente, Aprobado',
    ]);

    const todos = Object.values(respuesta.errores).flat();
    expect(todos.join(' ')).not.toMatch(/must be|should not|must not/i);
    expect(respuesta.mensaje).toBe('El título es requerido.');
  });

  it('no repite el mismo texto cuando varios validadores fallan en un campo', async () => {
    const dto = plainToInstance(TokenPrueba, { token: '' });
    const errores = await validate(dto, { whitelist: true });
    const respuesta = mapValidationErrors(errores);

    expect(respuesta.errores.token).toEqual([
      'El enlace de recuperación no es válido.',
    ]);
  });
});
