import { IsArray, IsIn, IsOptional } from 'class-validator';

// claves válidas del landing (espejo de LANDING_SECTION_KEYS)
const LANDING_KEYS = [
  'hero',
  'sobre-nosotros',
  'historia',
  'contacto',
  'horarios',
  'bautizos',
  'servicios',
  'donaciones',
] as const;

export class RestablecerLandingDto {
  // si no viene, el service restablece todas las secciones
  @IsOptional()
  @IsArray({ message: 'Las secciones deben enviarse como arreglo.' })
  @IsIn(LANDING_KEYS, {
    each: true,
    message: 'Una de las secciones indicadas no es válida.',
  })
  sectionKeys?: string[];
}
