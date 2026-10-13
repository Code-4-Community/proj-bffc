import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StewardEventsService } from './steward-events.service';
import { StewardEvent } from '../entities/steward-event.entity';
import { Site } from '../entities/site.entity';
import { User } from '../entities/user.entity';

describe('StewardEventsService', () => {
  let service: StewardEventsService;
  let mockRepo: { find: jest.Mock };

  const siteId = '123e4567-e89b-12d3-a456-426614174000';

  const workday: StewardEvent = {
    id: 'event-1',
    name: 'Community Workday',
    description: 'Monthly cleanup and mulching.',
    date: '2026-09-20',
    time: '10:00:00',
    place: 'Meet at the barn',
    site: {} as Site,
    steward: {} as User,
  };

  const wateringShift: StewardEvent = {
    id: 'event-2',
    name: 'Weekly Watering Shift',
    description: 'Help water the beds.',
    date: '2026-09-27',
    time: '09:00:00',
    place: 'Front gate',
    site: {} as Site,
    steward: {} as User,
  };

  beforeEach(async () => {
    mockRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StewardEventsService,
        { provide: getRepositoryToken(StewardEvent), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StewardEventsService>(StewardEventsService);
  });

  describe('findBySite', () => {
    it('should query only the given site, sorted by date then time', async () => {
      mockRepo.find.mockResolvedValue([]);

      await service.findBySite(siteId);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { site: { id: siteId } },
        order: { date: 'ASC', time: 'ASC' },
      });
    });

    it('should return mapped events for a site with steward events', async () => {
      mockRepo.find.mockResolvedValue([workday, wateringShift]);

      const result = await service.findBySite(siteId);

      expect(result).toEqual([
        {
          id: 'event-1',
          name: 'Community Workday',
          description: 'Monthly cleanup and mulching.',
          date: '2026-09-20',
          time: '10:00:00',
          place: 'Meet at the barn',
          eventType: 'steward',
        },
        {
          id: 'event-2',
          name: 'Weekly Watering Shift',
          description: 'Help water the beds.',
          date: '2026-09-27',
          time: '09:00:00',
          place: 'Front gate',
          eventType: 'steward',
        },
      ]);
    });

    it('should preserve the repository ordering', async () => {
      mockRepo.find.mockResolvedValue([workday, wateringShift]);

      const result = await service.findBySite(siteId);

      expect(result.map((e) => e.id)).toEqual(['event-1', 'event-2']);
    });

    it('should not expose site or steward relations', async () => {
      mockRepo.find.mockResolvedValue([workday]);

      const [event] = await service.findBySite(siteId);

      expect(event).not.toHaveProperty('site');
      expect(event).not.toHaveProperty('steward');
    });

    it('should return an empty array when the site has no steward events', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findBySite(siteId);

      expect(result).toEqual([]);
    });
  });
});
