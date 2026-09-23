import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
    roles?: string[];
    permisos?: string[];
    accesoPanel?: boolean;
  };
  refreshToken?: string;
}
