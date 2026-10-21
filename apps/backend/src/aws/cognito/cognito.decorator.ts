import { SetMetadata } from '@nestjs/common';

// Metadata key to state that the route is PUBLIC and thus NOT PROTECTED by authentication(Cognito JWT Guard)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Metadata key for required Cognito groups. Read by {@link RolesGuard}.
 * Routes without this metadata are not role-restricted (JWT auth still applies).
 */
export const ROLES_KEY = 'roles';

/**
 * Restricts a route to callers whose access token includes at least one of
 * the given Cognito groups (e.g. `@Roles('admin')`). Pair with
 * {@link RolesGuard}, which is registered as a global `APP_GUARD`.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
