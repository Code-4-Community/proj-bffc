import { Test } from '@nestjs/testing';
import { StewardEventsController } from './steward-events.controller';
import { StewardEventsService } from './steward-events.service';

describe('StewardEventsController', () => {
  it('returns the service result for the given siteId', async () => {
    const siteId = '123e4567-e89b-12d3-a456-426614174000';
    const events = [{ id: 'event-1', eventType: 'steward' }];
    const findBySite = jest.fn().mockResolvedValue(events);
    const module = await Test.createTestingModule({
      controllers: [StewardEventsController],
      providers: [{ provide: StewardEventsService, useValue: { findBySite } }],
    }).compile();

    const result = await module
      .get(StewardEventsController)
      .getStewardEvents(siteId);

    expect(findBySite).toHaveBeenCalledWith(siteId);
    expect(result).toBe(events);
  });
});
