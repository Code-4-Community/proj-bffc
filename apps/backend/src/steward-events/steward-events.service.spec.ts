import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StewardEventsService } from './steward-events.service';
import { StewardEvent } from '../entities/steward-event.entity';

describe('StewardEventsService', () => {
  const siteId = '123e4567-e89b-12d3-a456-426614174000';
  const event = {
    id: 'event-1',
    name: 'Community Workday',
    description: 'Monthly cleanup and mulching.',
    date: '2026-09-20',
    time: '10:00:00',
    place: 'Meet at the barn',
  };
  let service: StewardEventsService;
  let find: jest.Mock;

  beforeEach(async () => {
    find = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        StewardEventsService,
        { provide: getRepositoryToken(StewardEvent), useValue: { find } },
      ],
    }).compile();
    service = module.get(StewardEventsService);
  });

  it('queries only the given site, sorted by date then time', async () => {
    find.mockResolvedValue([]);
    await service.findBySite(siteId);
    expect(find).toHaveBeenCalledWith({
      where: { site: { id: siteId } },
      order: { date: 'ASC', time: 'ASC' },
    });
  });

  it('returns events tagged as steward-run for a site with events', async () => {
    find.mockResolvedValue([event]);
    expect(await service.findBySite(siteId)).toEqual([
      { ...event, eventType: 'steward' },
    ]);
  });

  it('returns an empty array for a site with no events', async () => {
    find.mockResolvedValue([]);
    expect(await service.findBySite(siteId)).toEqual([]);
  });
});
