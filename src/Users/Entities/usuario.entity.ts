import { Role } from '../../Common/Enums/Roles';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;
  //cuidado con eso por la base de datos como estoy usando sqlite no me deja poner un enum
  //cuando nos cambiemos a postgresql si nos va a dejar poner un enum
  @Column({ type: 'enum', default: Role.USER, enum: Role })
  //@Column({ default: Role.USER })
  role: string;
  // usuario.entity.ts (agregar esta columna)
  @Column({ select: false, nullable: true, type: 'varchar' })
  refreshTokenHash: string | null;
}


//QUITAR EL CONFIRM PASSWORD, no tiene sentido guardarlo en la tabla
