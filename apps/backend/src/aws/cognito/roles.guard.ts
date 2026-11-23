import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { isAuthDisabled } from './cognito.config';
import { ROLES_KEY } from './roles.decorator';
import {
  AccessTokenPayload,
  COGNITO_GROUPS,
  CognitoRole,
} from './cognito.types';

/**
 * Authorizes a request by the caller's Cognito groups.
 *
 * Runs after the global CognitoJWTGuard, which sets `request.user`. Routes
 * without `@Roles()` are allowed through. When auth is disabled
 * (AUTH_DISABLED=true) no user exists, so the check is skipped.
 *
 * @throws {ForbiddenException} If the caller is in none of the required groups.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<
      CognitoRole[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required || required.length === 0) {
      return true;
    }
    if (isAuthDisabled()) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AccessTokenPayload }>();
    const groups = request.user?.['cognito:groups'] ?? [];
    const allowed = required.some((role) =>
      groups.includes(COGNITO_GROUPS[role]),
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
