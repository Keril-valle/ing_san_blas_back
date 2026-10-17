import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

// Configuración del formulario de inscripción de catequesis que se edita
// desde el landing: el número SINPE del pago (paso 6) y el PDF de
// lineamientos que se lee/acepta en el último paso (paso 7).
export class UpdateCatequesisDto {
  @Transform(transformarTexto)
  @IsString({ message: 'El número SINPE debe ser texto.' })
  @IsNotEmpty({ message: 'El número SINPE es obligatorio.' })
  @MaxLength(40, {
    message: 'El número SINPE no puede superar 40 caracteres.',
  })
  @Matches(/^(?!0)/, {
    message: 'El número no puede empezar con 0.',
  })
  @Matches(/^[\d\s-]{8,40}$/, {
    message: 'El número SINPE no tiene un formato válido.',
  })
  sinpe: string;

  @Transform(transformarTexto)
  @IsString({ message: 'El PDF de lineamientos debe ser texto.' })
  @IsNotEmpty({ message: 'El PDF de lineamientos es obligatorio.' })
  @MaxLength(300, {
    message: 'La ruta del PDF no puede superar 300 caracteres.',
  })
  // acepta rutas locales (/lineamientos-....pdf) y URLs subidas a Cloudinary,
  // así el formulario sigue funcionando aunque todavía no se haya subido un PDF nuevo
  @Matches(/^(\/[^\s]*|https:\/\/[^\s]+)$/, {
    message: 'El PDF debe ser una ruta local (/...) o una URL https.',
  })
  lineamientosUrl: string;
}
