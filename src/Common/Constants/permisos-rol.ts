export const PERMISOS_ROL = [
  { id: 'panel', label: 'Acceso al panel administrativo' },
  { id: 'usuarios', label: 'Gestión de usuarios y roles' },
  { id: 'landing', label: 'Editar el landing (CMS)' },
  { id: 'eventos', label: 'Gestionar eventos' },
  { id: 'donaciones', label: 'Gestionar donaciones' },
  { id: 'catequesis', label: 'Solicitudes de catequesis' },
  { id: 'constancias', label: 'Solicitudes de constancias' },
  { id: 'sacramentos', label: 'Registro de sacramentos' },
] as const;

export type PermisoRolId = (typeof PERMISOS_ROL)[number]['id'];

export const IDS_PERMISOS_ROL = PERMISOS_ROL.map((item) => item.id);

export function claveDesdeNombre(nombre: string): string {
  const clave = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return clave || 'rol';
}
