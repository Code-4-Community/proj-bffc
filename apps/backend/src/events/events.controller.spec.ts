import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../aws/cognito/cognito.decorator';
import { ROLES_KEY } from '../aws/cognito/roles.decorator';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { UserType } from '../entities/user.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';

describe('EventsController', () => {
  let controller: EventsController;
  let service: { findAllForAdmin: jest.Mock; createAdminEvent: jest.Mock };

  const sample: AdminEventResponseDto[] = [
    {
      id: 'evt-1',
      site: { id: 'site-1', name: 'Egleston' },
      name: 'Harvest',
      date: '2026-10-25',
      time: '14:00:00',
      description: 'Cider',
      place: 'Orchard',
      registrationLink: 'https://lu.ma/harvest',
    },
  ];

  beforeEach(async () => {
    service = {
      findAllForAdmin: jest.fn().mockResolvedValue(sample),
      createAdminEvent: jest.fn().mockResolvedValue(sample[0]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(EventsController);
  });

  it('forwards query filters and returns the service result', async () => {
    const query = {
      site_id: '11111111-1111-4111-8111-111111111111',
    };

    await expect(controller.getAdminEvents(query)).resolves.toEqual(sample);
    expect(service.findAllForAdmin).toHaveBeenCalledWith(query);
  });

  it('marks GET /adminEvent as @Public()', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      EventsController.prototype.getAdminEvents,
    );
    expect(isPublic).toBe(true);
  });

  it('forwards the body of POST /adminEvent to the service', async () => {
    const body = {
      site_id: '11111111-1111-4111-8111-111111111111',
      name: 'Harvest',
      description: 'Cider',
      place: 'Orchard',
      date: '2026-10-25',
      startTime: '14:00:00',
      endTime: '16:00:00',
      registrationLink: 'https://lu.ma/harvest',
    };

    await expect(controller.createAdminEvent(body)).resolves.toEqual(sample[0]);
    expect(service.createAdminEvent).toHaveBeenCalledWith(body);
  });

  it('protects POST /adminEvent: admin-only, not public, RolesGuard applied', () => {
    const handler = EventsController.prototype.createAdminEvent;
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserType.ADMIN]);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(RolesGuard);
    expect(Reflect.getMetadata('__httpCode__', handler)).toBe(201);
  });
});
