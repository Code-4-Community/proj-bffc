import { Request } from 'express';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mockClient } from 'aws-sdk-client-mock';
import { UserType } from '../../entities/user.entity';

import { AuthConfigurationError } from './cognito.config';
import { CognitoService } from './cognito.service';
import { AccessTokenPayload } from './cognito.types';

type TestRequest = Request & { user?: AccessTokenPayload };

const ENV_KEYS = [
  'AUTH_DISABLED',
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
  'COGNITO_REGION',
] as const;

// Snapshot the auth env once so each test can mutate it freely without
// clobbering a value the developer had set in their own shell.
const ORIGINAL_ENV: Record<string, string | undefined> = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function restoreEnv(): void {
  ENV_KEYS.forEach((key) => {
    const original = ORIGINAL_ENV[key];
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  });
}

// Only the user pool ID and client ID are required to enable auth. COGNITO_REGION
// is optional: when unset it is derived from the user pool ID (format <region>_<id>).
const REQUIRED_ENV_KEYS = [
  'COGNITO_USER_POOL_ID',
  'COGNITO_CLIENT_ID',
] as const;

describe('CognitoService', () => {
  describe('getUser', () => {
    let service: CognitoService;

    beforeEach(() => {
      delete process.env.AUTH_DISABLED;
      process.env.COGNITO_USER_POOL_ID = 'us-east-2_TestPool';
      process.env.COGNITO_CLIENT_ID = '4h57k9lmno1pqrstuv2wxyz3ab';
      process.env.COGNITO_REGION = 'us-east-2';
      service = new CognitoService();
    });

    // Restore environment variables after each test
    afterEach(() => {
      restoreEnv();
    });

    // Auth is only ever off by explicit opt-in, in which case there is no user
    // to return regardless of the request.
    it('returns null when auth is explicitly disabled', () => {
      process.env.AUTH_DISABLED = 'true';

      expect(service.getUser({ headers: {} } as TestRequest)).toBeNull();
    });

    // getUser reads the AUTH_DISABLED flag rather than re-resolving the config, so
    // an unusable config is not its problem to report: CognitoModule already failed
    // startup over it, and CognitoJWTGuard resolves the config ahead of its @Public()
    // branch, so every request 401s before any handler can call getUser.
    it.each(REQUIRED_ENV_KEYS)(
      'returns null rather than throwing when %s is missing (the guard owns that rejection)',
      (missingKey) => {
        delete process.env[missingKey];

        expect(service.getUser({ headers: {} } as TestRequest)).toBeNull();
      },
    );

    // The flag itself is still parsed strictly: a typo must never be read as
    // "not disabled" and silently return a user.
    it('throws when AUTH_DISABLED has an unrecognized value', () => {
      process.env.AUTH_DISABLED = 'ture';

      expect(() => service.getUser({ headers: {} } as TestRequest)).toThrow(
        AuthConfigurationError,
      );
    });

    // COGNITO_REGION is optional (derived from the user pool ID), so auth stays
    // enabled without it and getUser still returns an attached payload.
    it('returns the JWT payload when COGNITO_REGION is missing (region derived)', () => {
      delete process.env.COGNITO_REGION;

      const payload: AccessTokenPayload = {
        sub: 'user-1',
        client_id: 'test-client',
        token_use: 'access',
        iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_TestPool',
        exp: 9999999999,
        iat: 1,
      };
      const request = { user: payload } as TestRequest;

      expect(service.getUser(request)).toEqual(payload);
    });

    it('returns the JWT payload when auth is active and user is on the request', () => {
      const payload: AccessTokenPayload = {
        sub: 'user-1',
        client_id: 'test-client',
        token_use: 'access',
        iss: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_TestPool',
        exp: 9999999999,
        iat: 1,
      };
      const request = { user: payload } as TestRequest;

      expect(service.getUser(request)).toEqual(payload);
    });

    it('returns null when auth is active and user is not on the request', () => {
      expect(service.getUser({ headers: {} } as TestRequest)).toBeNull();
    });
  });
});

describe('CognitoService admin functions', () => {
  const cognitoMock = mockClient(CognitoIdentityProviderClient);
  const POOL_ID = 'us-east-2_TestPool';
  let service: CognitoService;

  const awsError = (name: string) => Object.assign(new Error(name), { name });

  beforeEach(() => {
    cognitoMock.reset();
    delete process.env.AUTH_DISABLED;
    process.env.COGNITO_USER_POOL_ID = POOL_ID;
    process.env.COGNITO_CLIENT_ID = '4h57k9lmno1pqrstuv2wxyz3ab';
    process.env.COGNITO_REGION = 'us-east-2';
    service = new CognitoService();
  });

  afterEach(() => {
    restoreEnv();
  });

  describe('createUser', () => {
    it('creates a verified user with the invite email suppressed and adds them to the group', async () => {
      cognitoMock.on(AdminCreateUserCommand).resolves({
        User: {
          Enabled: true,
          Attributes: [{ Name: 'sub', Value: 'abc-123' }],
        },
      });
      cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

      const result = await service.createUser({
        email: ' Steward@Example.com ',
        role: UserType.STEWARD,
      });

      expect(result).toEqual({
        username: 'steward@example.com',
        sub: 'abc-123',
        email: 'steward@example.com',
        role: UserType.STEWARD,
        enabled: true,
      });
      expect(
        cognitoMock.commandCalls(AdminCreateUserCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'steward@example.com',
        UserAttributes: [
          { Name: 'email', Value: 'steward@example.com' },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      });
      expect(
        cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'steward@example.com',
        GroupName: 'stewards',
      });
    });

    it('adds admins to the admins group', async () => {
      cognitoMock.on(AdminCreateUserCommand).resolves({ User: {} });
      cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

      await service.createUser({
        email: 'a@example.com',
        role: UserType.ADMIN,
      });

      expect(
        cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input
          .GroupName,
      ).toBe('admins');
    });

    it('throws ConflictException when the email already exists', async () => {
      cognitoMock
        .on(AdminCreateUserCommand)
        .rejects(awsError('UsernameExistsException'));

      await expect(
        service.createUser({ email: 'a@example.com', role: UserType.STEWARD }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(cognitoMock.commandCalls(AdminAddUserToGroupCommand)).toHaveLength(
        0,
      );
    });

    it('throws InternalServerErrorException on an unexpected AWS error', async () => {
      cognitoMock
        .on(AdminCreateUserCommand)
        .rejects(awsError('ServiceFailure'));

      await expect(
        service.createUser({ email: 'a@example.com', role: UserType.STEWARD }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('deletes the new user and throws when the group assignment fails', async () => {
      cognitoMock.on(AdminCreateUserCommand).resolves({ User: {} });
      cognitoMock
        .on(AdminAddUserToGroupCommand)
        .rejects(awsError('ResourceNotFoundException'));
      cognitoMock.on(AdminDeleteUserCommand).resolves({});

      await expect(
        service.createUser({ email: 'a@example.com', role: UserType.STEWARD }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(cognitoMock.commandCalls(AdminDeleteUserCommand)).toHaveLength(1);
    });

    it('throws InternalServerErrorException when Cognito is not configured', async () => {
      process.env.AUTH_DISABLED = 'true';

      await expect(
        service.createUser({ email: 'a@example.com', role: UserType.STEWARD }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(cognitoMock.calls()).toHaveLength(0);
    });
  });

  describe('addUserToGroup / removeUserFromGroup', () => {
    it('adds a user to the group for their role', async () => {
      cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

      await service.addUserToGroup('A@Example.com', UserType.ADMIN);

      expect(
        cognitoMock.commandCalls(AdminAddUserToGroupCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'a@example.com',
        GroupName: 'admins',
      });
    });

    it('removes a user from the group for their role', async () => {
      cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});

      await service.removeUserFromGroup('a@example.com', UserType.STEWARD);

      expect(
        cognitoMock.commandCalls(AdminRemoveUserFromGroupCommand)[0].args[0]
          .input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'a@example.com',
        GroupName: 'stewards',
      });
    });

    it('throws NotFoundException when the user does not exist (add)', async () => {
      cognitoMock
        .on(AdminAddUserToGroupCommand)
        .rejects(awsError('UserNotFoundException'));

      await expect(
        service.addUserToGroup('a@example.com', UserType.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InternalServerErrorException on an unexpected AWS error (remove)', async () => {
      cognitoMock
        .on(AdminRemoveUserFromGroupCommand)
        .rejects(awsError('ServiceFailure'));

      await expect(
        service.removeUserFromGroup('a@example.com', UserType.ADMIN),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('disableUser / enableUser', () => {
    it('disables a user', async () => {
      cognitoMock.on(AdminDisableUserCommand).resolves({});

      await service.disableUser('A@Example.com');

      expect(
        cognitoMock.commandCalls(AdminDisableUserCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'a@example.com',
      });
    });

    it('enables a user', async () => {
      cognitoMock.on(AdminEnableUserCommand).resolves({});

      await service.enableUser('a@example.com');

      expect(
        cognitoMock.commandCalls(AdminEnableUserCommand)[0].args[0].input,
      ).toEqual({
        UserPoolId: POOL_ID,
        Username: 'a@example.com',
      });
    });

    it('throws NotFoundException when disabling an unknown user', async () => {
      cognitoMock
        .on(AdminDisableUserCommand)
        .rejects(awsError('UserNotFoundException'));

      await expect(service.disableUser('a@example.com')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws InternalServerErrorException on an unexpected AWS error (enable)', async () => {
      cognitoMock
        .on(AdminEnableUserCommand)
        .rejects(awsError('ServiceFailure'));

      await expect(service.enableUser('a@example.com')).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });
});
