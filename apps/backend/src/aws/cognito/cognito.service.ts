import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { Request } from 'express';
import {
  AccessTokenPayload,
  COGNITO_GROUPS,
  CognitoRole,
  CognitoUserResult,
} from './cognito.types';
import { getCognitoConfig, isAuthDisabled } from './cognito.config';
import { CreateCognitoUserDto } from './dto/create-cognito-user.dto';

@Injectable()
export class CognitoService {
  private readonly logger = new Logger(CognitoService.name);

  /**
   * Retrieves the authenticated user's verified access token payload from the request.
   *
   * The {@link CognitoJWTGuard} verifies the incoming bearer token and attaches the
   * decoded payload to `request.user` before the route handler runs. This method reads
   * that payload back out in a type-safe way, since Express's `Request` type has no
   * knowledge of the `user` property the guard adds.
   *
   * @param request - The incoming Express request, expected to have passed through {@link CognitoJWTGuard}.
   * @returns The verified {@link AccessTokenPayload} for the authenticated user, or `null`
   *   if authentication is disabled or no valid token was attached to the request.
   */
  getUser(request: Request): AccessTokenPayload | null {
    // If authentication was explicitly disabled, there is no user to return.
    // Reads the flag rather than re-resolving the config: the guard already ran.
    if (isAuthDisabled()) {
      this.logger.debug(
        'getUser returning null: authentication is disabled (AUTH_DISABLED=true)',
      );
      return null;
    }
    // The CognitoJWTGuard attaches the verified JWT payload to request.user,
    // but Express's Request type doesn't know about it, so we widen the type.
    const authenticatedRequest = request as Request & {
      user: AccessTokenPayload;
    };

    // user may be undefined if no token was attached; normalize that to null.
    if (!authenticatedRequest.user) {
      this.logger.warn(
        'getUser returning null: no verified user attached to the request. ' +
          'Auth is enabled, request bypassed CognitoJWTGuard (a @Public() route) or the guard did not run for this handler.',
      );
      return null;
    }
    return authenticatedRequest.user;
  }

  // Built on first use so startup and getUser do not depend on AWS settings.
  private client?: CognitoIdentityProviderClient;
  private userPoolId?: string;

  private getClient(): {
    client: CognitoIdentityProviderClient;
    userPoolId: string;
  } {
    if (!this.client || !this.userPoolId) {
      const config = getCognitoConfig();
      if (!config) {
        throw new InternalServerErrorException(
          'Cognito is not configured: AUTH_DISABLED=true, so user management is unavailable.',
        );
      }
      this.client = new CognitoIdentityProviderClient({
        region: config.region,
      });
      this.userPoolId = config.userPoolId;
    }
    return { client: this.client, userPoolId: this.userPoolId };
  }

  // Cognito usernames are the email, lowercased so one address maps to one account.
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Maps an AWS error to the HTTP exception we want callers to see.
   * Nest exceptions pass through unchanged.
   */
  private handleError(error: unknown, action: string): never {
    if (error instanceof HttpException) {
      throw error;
    }
    const name = (error as { name?: string })?.name;
    if (name === 'UsernameExistsException') {
      throw new ConflictException('A user with this email already exists');
    }
    if (name === 'UserNotFoundException') {
      throw new NotFoundException('No user with this email exists');
    }
    this.logger.error(
      `Failed to ${action}: ${(error as Error)?.message ?? String(error)}`,
      (error as Error)?.stack,
    );
    throw new InternalServerErrorException(
      `Failed to ${action} Cognito user: ${
        (error as Error)?.message ?? 'unknown error'
      }`,
    );
  }

  /**
   * Creates a Cognito account with a verified email and adds it to the role's group.
   * Cognito's invite email (with a temporary password) is suppressed.
   *
   * @throws {ConflictException} If an account with this email already exists.
   * @throws {InternalServerErrorException} On any other AWS failure.
   */
  async createUser(dto: CreateCognitoUserDto): Promise<CognitoUserResult> {
    const { client, userPoolId } = this.getClient();
    const username = this.normalizeEmail(dto.email);

    let sub: string | undefined;
    let enabled = true;
    try {
      const result = await client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: username,
          UserAttributes: [
            { Name: 'email', Value: username },
            { Name: 'email_verified', Value: 'true' },
          ],
          MessageAction: 'SUPPRESS',
        }),
      );
      sub = result.User?.Attributes?.find((a) => a.Name === 'sub')?.Value;
      enabled = result.User?.Enabled ?? true;
    } catch (error) {
      this.handleError(error, 'create');
    }

    try {
      await this.addUserToGroup(username, dto.role);
    } catch (error) {
      // Do not leave an account behind with no role.
      try {
        await client.send(
          new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: username,
          }),
        );
      } catch (cleanupError) {
        this.logger.error(
          `Could not remove ${username} after a failed group assignment: ${
            (cleanupError as Error)?.message
          }`,
        );
      }
      throw error;
    }

    return { username, sub, email: username, role: dto.role, enabled };
  }

  /** Adds the user to the group for `role`. */
  async addUserToGroup(email: string, role: CognitoRole): Promise<void> {
    const { client, userPoolId } = this.getClient();
    try {
      await client.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: this.normalizeEmail(email),
          GroupName: COGNITO_GROUPS[role],
        }),
      );
    } catch (error) {
      this.handleError(error, 'add group to');
    }
  }

  /** Removes the user from the group for `role`. */
  async removeUserFromGroup(email: string, role: CognitoRole): Promise<void> {
    const { client, userPoolId } = this.getClient();
    try {
      await client.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId,
          Username: this.normalizeEmail(email),
          GroupName: COGNITO_GROUPS[role],
        }),
      );
    } catch (error) {
      this.handleError(error, 'remove group from');
    }
  }

  /** Blocks the user from signing in without deleting the account. */
  async disableUser(email: string): Promise<void> {
    const { client, userPoolId } = this.getClient();
    try {
      await client.send(
        new AdminDisableUserCommand({
          UserPoolId: userPoolId,
          Username: this.normalizeEmail(email),
        }),
      );
    } catch (error) {
      this.handleError(error, 'disable');
    }
  }

  /** Restores a disabled user's access. */
  async enableUser(email: string): Promise<void> {
    const { client, userPoolId } = this.getClient();
    try {
      await client.send(
        new AdminEnableUserCommand({
          UserPoolId: userPoolId,
          Username: this.normalizeEmail(email),
        }),
      );
    } catch (error) {
      this.handleError(error, 'enable');
    }
  }
}
