import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import { ROLES_KEY } from '../aws/cognito/cognito.decorator';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { AccessTokenPayload } from '../aws/cognito/cognito.types';
import { UserType } from '../entities/user.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventSourceType } from './events.types';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';

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

describe('EventsController', () => {
  let controller: EventsController;
  let service: { findAllForAdmin: jest.Mock };

  const sample: AdminEventResponseDto[] = [
    {
      id: 'evt-1',
      site: { id: 'site-1', name: 'Egleston' },
      name: 'Harvest',
      date: '2026-10-25',
      time: '14:00:00',
      description: 'Cider',
      eventType: 'harvest',
      sourceType: EventSourceType.LUMA,
      registrationLink: 'https://lu.ma/harvest',
    },
  ];

  beforeEach(async () => {
    service = { findAllForAdmin: jest.fn().mockResolvedValue(sample) };

    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(EventsController);
  });

  it('forwards query filters and returns the service result', async () => {
    const query = {
      site_id: '11111111-1111-4111-8111-111111111111',
      event_type: 'harvest',
      source_type: EventSourceType.LUMA,
    };

    await expect(controller.getAdminEvents(query)).resolves.toEqual(sample);
    expect(service.findAllForAdmin).toHaveBeenCalledWith(query);
  });

  it('declares @Roles(admin) on GET /adminEvent', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      EventsController.prototype.getAdminEvents,
    );
    expect(roles).toEqual([UserType.ADMIN]);
  });
});

describe('GET /adminEvent permissions (RolesGuard)', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  function createContext(groups?: string[]): ExecutionContext {
    const request = {
      user: groups
        ? ({ 'cognito:groups': groups } as AccessTokenPayload)
        : undefined,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => EventsController.prototype.getAdminEvents,
      getClass: () => EventsController,
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserType.ADMIN]),
    };
    guard = new RolesGuard(reflector as unknown as Reflector);
    delete process.env.AUTH_DISABLED;
  });

  afterEach(() => {
    restoreEnv();
  });

  it('allows callers in the admin Cognito group', () => {
    expect(guard.canActivate(createContext(['admin']))).toBe(true);
  });

  it('rejects stewards', () => {
    expect(() => guard.canActivate(createContext(['steward']))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects authenticated callers with no groups', () => {
    expect(() => guard.canActivate(createContext([]))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects when no verified user is attached', () => {
    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('skips role checks when AUTH_DISABLED=true', () => {
    process.env.AUTH_DISABLED = 'true';
    expect(guard.canActivate(createContext(['steward']))).toBe(true);
  });
});
