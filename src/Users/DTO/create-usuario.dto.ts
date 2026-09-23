import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class CreateUsuarioDto extends RegisterDto {
  @IsOptional()
  @IsArray({ message: 'Los roles deben venir como una lista.' })
  @IsString({ each: true, message: 'Cada rol debe ser texto.' })
  roles?: string[];

  @Transform(transformarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^[1-9]\d{3}-\d{4}$/, {
    message:
      'El teléfono debe tener el formato 8888-8888 y no comenzar con cero',
  })
  telefono: string;
}
