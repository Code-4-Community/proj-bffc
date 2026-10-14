import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { isAuthDisabled } from './cognito.config';
import { ROLES_KEY } from './cognito.decorator';
import { AccessTokenPayload } from './cognito.types';

/**
 * Enforces `@Roles(...)` metadata against the caller's Cognito groups.
 *
 * Routes without `@Roles()` are unaffected. When `AUTH_DISABLED=true`, role
 * checks are skipped so local development without a user pool still works.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (isAuthDisabled()) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AccessTokenPayload }>();
    const groups = request.user?.['cognito:groups'] ?? [];
    const allowed = requiredRoles.some((role) => groups.includes(role));
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
