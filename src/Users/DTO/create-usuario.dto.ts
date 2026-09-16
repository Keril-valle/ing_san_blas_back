import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RegisterDto } from '../../Auth/DTO/register.dto';
import { Role } from '../../Common/Enums/Roles';
import { transformarTexto } from '../../Common/Utils/normalizar-texto';

export class CreateUsuarioDto extends RegisterDto {
  // valida que el rol esté dentro de los permitidos del sistema (mismo set que ofrece el frontend)
  @IsOptional()
  @IsString({ message: 'El rol debe ser texto.' })
  @IsIn(Object.values(Role), {
    message: 'El rol indicado no es un rol válido.',
  })
  role?: string;

<<<<<<< HEAD
=======
  // telefono es requerido para creación de usuario (override del opcional en RegisterDto)
>>>>>>> bd7a1deecf80cba859aa59e42afda582b1d64951
  @Transform(transformarTexto)
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^\d{4}-\d{4}$/, {
    message: 'El teléfono debe tener el formato 8888-8888',
  })
<<<<<<< HEAD
  telefono: string;
=======
  declare telefono: string;
>>>>>>> bd7a1deecf80cba859aa59e42afda582b1d64951
}
