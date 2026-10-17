import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ValidarEnlaceRecuperacionDto {
  @Transform(recortar)
  @IsString()
  @IsNotEmpty({ message: 'El enlace de recuperación no es válido.' })
  @MinLength(43, { message: 'El enlace de recuperación no es válido.' })
  @MaxLength(128, { message: 'El enlace de recuperación no es válido.' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'El enlace de recuperación no es válido.',
  })
  token: string;
}
