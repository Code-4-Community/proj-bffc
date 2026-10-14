import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './cognito.decorator';
import { AccessTokenPayload } from './cognito.types';
import { RolesGuard } from './roles.guard';

const ENV_KEYS = ['AUTH_DISABLED'] as const;
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

function createContext(groups?: string[]): ExecutionContext {
  const request = {
    user:
      groups === undefined
        ? undefined
        : ({ 'cognito:groups': groups } as AccessTokenPayload),
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
    delete process.env.AUTH_DISABLED;
  });

  afterEach(() => {
    restoreEnv();
  });

  it('allows routes that do not declare @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(createContext(['steward']))).toBe(true);
  });

  it('allows a caller whose Cognito groups include a required role', () => {
    reflector.getAllAndOverride.mockImplementation((key) =>
      key === ROLES_KEY ? ['admin'] : undefined,
    );
    expect(guard.canActivate(createContext(['admin', 'steward']))).toBe(true);
  });

  it('rejects a caller missing every required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(() => guard.canActivate(createContext(['steward']))).toThrow(
      ForbiddenException,
    );
  });

  it('skips enforcement when AUTH_DISABLED=true', () => {
    process.env.AUTH_DISABLED = 'true';
    reflector.getAllAndOverride.mockReturnValue(['admin']);
    expect(guard.canActivate(createContext(['steward']))).toBe(true);
  });
});
