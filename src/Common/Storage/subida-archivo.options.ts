import { memoryStorage } from 'multer';

/** Tamaño máximo que aceptan los endpoints que reciben archivos (5 MB). */
export const LIMITE_BYTES_ARCHIVO = 5 * 1024 * 1024;

/**
 * Opciones compartidas de Multer para subidas en memoria.
 * Centraliza el límite para que todos los controladores se comporten igual.
 */
export const SUBIDA_ARCHIVO_MEMORIA = {
  storage: memoryStorage(),
  limits: { fileSize: LIMITE_BYTES_ARCHIVO },
};
