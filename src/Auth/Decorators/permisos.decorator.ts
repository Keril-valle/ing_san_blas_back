import { SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisos';
export const Permisos = (...permisos: string[]) =>
  SetMetadata(PERMISOS_KEY, permisos);
