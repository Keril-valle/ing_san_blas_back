import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Validate,
  ValidatorConstraint,
} from 'class-validator';
import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';

export const PATRON_CEDULA_CATEQUESIS = /^(?:\d{9}|\d{12})$/;

@ValidatorConstraint({ name: 'cedulaPorTipo', async: false })
class CedulaPorTipoConstraint implements ValidatorConstraintInterface {
  // No basta con aceptar cualquiera de las dos longitudes: debe corresponder al tipo elegido.
  validate(valor: unknown, args: ValidationArguments): boolean {
    const { tipoCedula } = args.object as IdentificacionCatequesisDto;
    const patron = tipoCedula === 'extranjera' ? /^\d{12}$/ : /^\d{9}$/;
    return typeof valor === 'string' && patron.test(valor);
  }

  // Devuelve la regla exacta para que el formulario pueda señalar qué falta.
  defaultMessage(args: ValidationArguments): string {
    const { tipoCedula } = args.object as IdentificacionCatequesisDto;
    return `La cédula debe tener ${tipoCedula === 'extranjera' ? 12 : 9} dígitos.`;
  }
}

export class IdentificacionCatequesisDto {
  @IsIn(['nacional', 'extranjera'], {
    message: 'Seleccione un tipo de cédula válido.',
  })
  tipoCedula: 'nacional' | 'extranjera' = 'nacional'; // mantiene compatibles los clientes que ya mandaban nueve dígitos

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'La cédula es obligatoria.' })
  @Validate(CedulaPorTipoConstraint)
  cedula: string;
}
