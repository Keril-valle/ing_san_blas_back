import { Entity, PrimaryColumn } from 'typeorm';

@Entity('usuario_roles')
export class UsuarioRol {
  @PrimaryColumn({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @PrimaryColumn({ name: 'rol_id', type: 'int' })
  rolId: number;
}
