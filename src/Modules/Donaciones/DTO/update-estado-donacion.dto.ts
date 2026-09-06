import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateEstadoDonacionDto {
  @IsString()
  @IsNotEmpty({ message: 'El estado enviado no es válido.' })
  estado: string;
}
