import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class CreateUsuarioDto extends RegisterDto {
  @IsOptional()
  @IsString({ message: 'El rol debe ser texto.' })
  role?: string;

  @Transform(transformarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'El teléfono debe tener el formato 8888-8888',
  })
  telefono: string;
}
