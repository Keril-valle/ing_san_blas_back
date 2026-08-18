import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSacramentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  cedula: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primerNombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  segundoNombre?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primerApellido: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  segundoApellido: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  libro: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  folio: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  asiento: string;
}
