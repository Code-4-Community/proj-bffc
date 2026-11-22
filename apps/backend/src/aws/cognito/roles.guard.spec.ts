import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserType } from '../../entities/user.entity';
import { RolesGuard } from './roles.guard';

function contextFor(user?: { 'cognito:groups'?: string[] }): ExecutionContext {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;
  const original = process.env.AUTH_DISABLED;

  beforeEach(() => {
    delete process.env.AUTH_DISABLED;
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserType.ADMIN]),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  afterAll(() => {
    if (original === undefined) delete process.env.AUTH_DISABLED;
    else process.env.AUTH_DISABLED = original;
  });

  it('allows an admin', () => {
    expect(
      guard.canActivate(contextFor({ 'cognito:groups': ['admins'] })),
    ).toBe(true);
  });

  it('rejects a steward with 403', () => {
    expect(() =>
      guard.canActivate(contextFor({ 'cognito:groups': ['stewards'] })),
    ).toThrow(ForbiddenException);
  });

  it('rejects a user with no groups, or no user at all', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('allows routes without @Roles()', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });

  it('skips the check when AUTH_DISABLED=true', () => {
    process.env.AUTH_DISABLED = 'true';
    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });
});
