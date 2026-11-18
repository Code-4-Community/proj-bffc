import { Test } from '@nestjs/testing';

import { IS_PUBLIC_KEY } from '../aws/cognito/cognito.decorator';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';

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
});
