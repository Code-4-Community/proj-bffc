import { SetMetadata } from '@nestjs/common';

import { CognitoRole } from './cognito.types';

// Metadata key listing the roles allowed to call a route (enforced by RolesGuard)
export const ROLES_KEY = 'roles';

/**
 * Restricts a route to callers in at least one of the given roles.
 * Pair with `@UseGuards(RolesGuard)`; the global Cognito guard has already
 * authenticated the caller (401) by the time RolesGuard runs (403).
 */
export const Roles = (...roles: CognitoRole[]) => SetMetadata(ROLES_KEY, roles);
