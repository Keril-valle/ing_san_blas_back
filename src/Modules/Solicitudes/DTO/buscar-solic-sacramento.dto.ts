import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { TipoSacramento } from '../../../Common/Enums/TipoSacramento';

const normalizarConsulta = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class BuscarSolicSacramentoDto {
  @IsOptional()
  @Transform(normalizarConsulta)
  @IsString()
  @MaxLength(150)
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(9, 9, {
    message: 'La cédula debe contener exactamente 9 dígitos',
  })
  @Matches(/^\d+$/, {
    message:
      'El valor ingresado para cédula no es válido, debe contener solo números',
  })
  cedula?: string;

  @IsOptional()
  @IsIn(Object.values(TipoSacramento), {
    message: 'El tipo de sacramento ingresado no es válido',
  })
  tipo?: TipoSacramento;

  @IsOptional()
  @IsIn(['Pendiente', 'Aprobada', 'Rechazada'], {
    message: 'El estado ingresado no es válido',
  })
  estado?: string;
}
