import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { AdminEvent } from '../entities/admin-event.entity';
import { Site } from '../entities/site.entity';
import { RecurringEventService } from './recurring-event.service';
import { SortOrder } from './dto/recurring-event-query.dto';

const SITE_ID = '1a3cc442-d41f-421d-af8e-311781e6c033';

const site = {
  id: SITE_ID,
  name: 'Forest Hills Community Garden',
} as Site;

function adminEvent(
  overrides: Partial<AdminEvent> & { id: string; date: string; time: string },
): AdminEvent {
  return {
    name: 'Fall Harvest Festival',
    description: 'Join us for the annual harvest celebration',
    place: 'Main Garden Area',
    registrationLink: 'https://lu.ma/harvest-2026',
    site,
    ...overrides,
  } as AdminEvent;
}

describe('RecurringEventService', () => {
  let service: RecurringEventService;
  let adminEventRepo: { find: jest.Mock };
  let siteRepo: { exists: jest.Mock };

  beforeEach(async () => {
    adminEventRepo = { find: jest.fn().mockResolvedValue([]) };
    siteRepo = { exists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringEventService,
        {
          provide: getRepositoryToken(AdminEvent),
          useValue: adminEventRepo,
        },
        { provide: getRepositoryToken(Site), useValue: siteRepo },
      ],
    }).compile();

    service = module.get(RecurringEventService);
  });

  describe('findAllBySiteId', () => {
    it('throws NotFoundException when the site does not exist', async () => {
      siteRepo.exists.mockResolvedValue(false);

      await expect(service.findAllBySiteId(SITE_ID, {})).rejects.toThrow(
        NotFoundException,
      );
      expect(adminEventRepo.find).not.toHaveBeenCalled();
    });

    it('returns an empty array when the site has no events', async () => {
      adminEventRepo.find.mockResolvedValue([]);

      await expect(service.findAllBySiteId(SITE_ID, {})).resolves.toEqual([]);
      expect(siteRepo.exists).toHaveBeenCalledWith({ where: { id: SITE_ID } });
    });

    it('maps event fields to response DTO', async () => {
      adminEventRepo.find.mockResolvedValue([
        adminEvent({
          id: 'event-1',
          date: '2026-10-25',
          time: '14:00:00',
          name: 'Fall Harvest Festival',
          description: 'Join us for the annual harvest celebration',
          place: 'Main Garden Area',
          registrationLink: 'https://lu.ma/harvest-2026',
        }),
      ]);

      const [result] = await service.findAllBySiteId(SITE_ID, {});

      expect(result).toEqual({
        id: 'event-1',
        site: { id: SITE_ID, name: 'Forest Hills Community Garden' },
        name: 'Fall Harvest Festival',
        date: '2026-10-25',
        time: '14:00:00',
        description: 'Join us for the annual harvest celebration',
        place: 'Main Garden Area',
        registrationLink: 'https://lu.ma/harvest-2026',
      });
    });

    it('omits registrationLink when not present', async () => {
      adminEventRepo.find.mockResolvedValue([
        adminEvent({
          id: 'event-no-link',
          date: '2026-10-25',
          time: '10:00:00',
          registrationLink: '',
        }),
      ]);

      const [result] = await service.findAllBySiteId(SITE_ID, {});

      expect(result).not.toHaveProperty('registrationLink');
    });

    it('queries events with default ascending order', async () => {
      await service.findAllBySiteId(SITE_ID, {});

      expect(adminEventRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { date: 'ASC', time: 'ASC', id: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('queries events with descending order when specified', async () => {
      await service.findAllBySiteId(SITE_ID, { order: SortOrder.DESC });

      expect(adminEventRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { date: 'DESC', time: 'DESC', id: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('applies pagination parameters', async () => {
      await service.findAllBySiteId(SITE_ID, { page: 2, limit: 5 });

      expect(adminEventRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { date: 'ASC', time: 'ASC', id: 'ASC' },
        skip: 5,
        take: 5,
      });
    });

    it('normalizes TypeORM Date objects into expected formats', async () => {
      adminEventRepo.find.mockResolvedValue([
        adminEvent({
          id: 'date-obj',
          date: new Date(2026, 9, 25) as unknown as string,
          time: new Date(1970, 0, 1, 14, 30, 0) as unknown as string,
        }),
      ]);

      const [result] = await service.findAllBySiteId(SITE_ID, {});
      expect(result.date).toBe('2026-10-25');
      expect(result.time).toBe('14:30:00');
    });
  });
});
