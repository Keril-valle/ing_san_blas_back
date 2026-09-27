import type { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'san_blas_access';
export const REFRESH_TOKEN_COOKIE = 'san_blas_refresh';

const isProduction = process.env.NODE_ENV === 'production';

// En producción frontend y API viven en dominios distintos, por eso la cookie
// necesita SameSite=None y Secure para que el navegador la envíe en CORS.
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const clearCookieOptions: CookieOptions = baseCookieOptions;
