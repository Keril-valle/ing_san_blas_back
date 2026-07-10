// Auth/Decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
// esto es un decorador que se utiliza para marcar un endpoint como público, es decir, que no requiere autenticación para acceder a él. Se utiliza junto con el guard de autenticación para permitir el acceso a ciertos endpoints sin necesidad de un token de autenticación.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
