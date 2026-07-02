import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '../Guards/auth.guard';
import { RolesGuard } from '../Guards/roles.guard';
import { Roles } from './roles.decorator';
import { Role } from './Roles';

export const Auth = (...roles: Role[]) =>
  applyDecorators(
    Roles(...roles),
    UseGuards(AuthGuard, RolesGuard),
  );
