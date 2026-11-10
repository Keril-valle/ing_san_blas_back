import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CreateSolicSacramentoDto } from './create-solic-sacramento.dto';

// El token pertenece al envío público, no al registro que se guarda o edita.
export class CreateSolicSacramentoPublicaDto extends CreateSolicSacramentoDto {
  @IsString()
  @IsNotEmpty({ message: 'Completá el reCAPTCHA antes de enviar.' })
  @MaxLength(4096)
  recaptchaToken: string;
}
