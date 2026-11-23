import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../aws/cognito/cognito.decorator';
import { RecurringEventController } from './recurring-event.controller';
import { RecurringEventService } from './recurring-event.service';
import { PaginatedRecurringEventsDto } from './dto/recurring-event-response.dto';
import { SortOrder } from './dto/recurring-event-query.dto';

describe('RecurringEventController', () => {
  let controller: RecurringEventController;
  let mockService: { findAllBySiteId: jest.Mock };

  const siteId = '1a3cc442-d41f-421d-af8e-311781e6c033';
  const sample: PaginatedRecurringEventsDto = {
    data: [
      {
        id: 'event-1',
        site: { id: siteId, name: 'Forest Hills Community Garden' },
        name: 'Fall Harvest Festival',
        date: '2026-10-25',
        time: '14:00:00',
        description: 'Join us for the annual harvest celebration',
        place: 'Main Garden Area',
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  };

  beforeEach(async () => {
    mockService = { findAllBySiteId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringEventController],
      providers: [{ provide: RecurringEventService, useValue: mockService }],
    }).compile();

    controller = module.get(RecurringEventController);
  });

  it('marks GET /recurringEvent/:site_id as @Public()', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      RecurringEventController.prototype.getRecurringEventsBySite,
    );
    expect(isPublic).toBe(true);
  });

  it('forwards site_id and query params to the service', async () => {
    mockService.findAllBySiteId.mockResolvedValue(sample);
    const query = { order: SortOrder.DESC, page: 2, limit: 5 };

    await expect(
      controller.getRecurringEventsBySite(siteId, query),
    ).resolves.toEqual(sample);
    expect(mockService.findAllBySiteId).toHaveBeenCalledWith(siteId, query);
  });

  it('returns empty data array when the site has no events', async () => {
    const emptyResponse: PaginatedRecurringEventsDto = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    };
    mockService.findAllBySiteId.mockResolvedValue(emptyResponse);

    await expect(
      controller.getRecurringEventsBySite(siteId, {}),
    ).resolves.toEqual(emptyResponse);
  });

  it('propagates NotFoundException when the site does not exist', async () => {
    mockService.findAllBySiteId.mockRejectedValue(
      new NotFoundException('Site not found'),
    );

    await expect(
      controller.getRecurringEventsBySite(
        '00000000-0000-0000-0000-000000000000',
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
