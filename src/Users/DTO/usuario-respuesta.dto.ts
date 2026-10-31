import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UsuarioRespuestaDto {
  @Expose()
  id: number;

  @Expose({ name: 'nombre' })
  userName: string;

  @Expose()
  email: string;

  @Expose({ name: 'telefono' })
  phoneNumber: string | null;

  @Expose()
  role: string;

  @Expose()
  roles: string[];

  @Expose({ name: 'isActive' })
  state: boolean;

  /** Cuenta creada por invitación que aún no activó ni eligió contraseña. */
  @Expose()
  pendienteActivacion: boolean;

  @Expose({ name: 'createdAt' })
  creationDate: Date;

  @Exclude()
  password: string;

  @Exclude()
  refreshTokenHash: string | null;
}
