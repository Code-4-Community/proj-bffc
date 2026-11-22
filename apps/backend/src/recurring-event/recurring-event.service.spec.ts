import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { RecurringEvent } from '../entities/recurring-event.entity';
import { Site } from '../entities/site.entity';
import { RecurringEventService } from './recurring-event.service';
import { SortOrder } from './dto/recurring-event-query.dto';

const SITE_ID = '1a3cc442-d41f-421d-af8e-311781e6c033';

const site = {
  id: SITE_ID,
  name: 'Forest Hills Community Garden',
} as Site;

function recurringEvent(
  overrides: Partial<RecurringEvent> & {
    id: string;
    startDate: string;
    startTime: string;
  },
): RecurringEvent {
  return {
    name: 'Fall Harvest Festival',
    description: 'Join us for the annual harvest celebration',
    place: 'Main Garden Area',
    site,
    ...overrides,
  } as RecurringEvent;
}

describe('RecurringEventService', () => {
  let service: RecurringEventService;
  let recurringEventRepo: { findAndCount: jest.Mock };
  let siteRepo: { exists: jest.Mock };

  beforeEach(async () => {
    recurringEventRepo = { findAndCount: jest.fn().mockResolvedValue([[], 0]) };
    siteRepo = { exists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringEventService,
        {
          provide: getRepositoryToken(RecurringEvent),
          useValue: recurringEventRepo,
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
      expect(recurringEventRepo.findAndCount).not.toHaveBeenCalled();
    });

    it('returns empty data array when the site has no events', async () => {
      recurringEventRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllBySiteId(SITE_ID, {});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(siteRepo.exists).toHaveBeenCalledWith({ where: { id: SITE_ID } });
    });

    it('maps event fields to response DTO', async () => {
      recurringEventRepo.findAndCount.mockResolvedValue([
        [
          recurringEvent({
            id: 'event-1',
            startDate: '2026-10-25',
            startTime: '14:00:00',
            name: 'Fall Harvest Festival',
            description: 'Join us for the annual harvest celebration',
            place: 'Main Garden Area',
          }),
        ],
        1,
      ]);

      const result = await service.findAllBySiteId(SITE_ID, {});

      expect(result.data[0]).toEqual({
        id: 'event-1',
        site: { id: SITE_ID, name: 'Forest Hills Community Garden' },
        name: 'Fall Harvest Festival',
        date: '2026-10-25',
        time: '14:00:00',
        description: 'Join us for the annual harvest celebration',
        place: 'Main Garden Area',
      });
    });

    it('returns pagination metadata correctly', async () => {
      recurringEventRepo.findAndCount.mockResolvedValue([
        [
          recurringEvent({
            id: 'event-1',
            startDate: '2026-10-25',
            startTime: '14:00:00',
          }),
        ],
        25,
      ]);

      const result = await service.findAllBySiteId(SITE_ID, {
        page: 2,
        limit: 5,
      });

      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('queries events with default ascending order', async () => {
      await service.findAllBySiteId(SITE_ID, {});

      expect(recurringEventRepo.findAndCount).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { startDate: 'ASC', startTime: 'ASC', id: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('queries events with descending order when specified', async () => {
      await service.findAllBySiteId(SITE_ID, { order: SortOrder.DESC });

      expect(recurringEventRepo.findAndCount).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { startDate: 'DESC', startTime: 'DESC', id: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('applies pagination parameters', async () => {
      await service.findAllBySiteId(SITE_ID, { page: 2, limit: 5 });

      expect(recurringEventRepo.findAndCount).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { site: true },
        order: { startDate: 'ASC', startTime: 'ASC', id: 'ASC' },
        skip: 5,
        take: 5,
      });
    });

    it('normalizes TypeORM Date objects into expected formats', async () => {
      recurringEventRepo.findAndCount.mockResolvedValue([
        [
          recurringEvent({
            id: 'date-obj',
            startDate: new Date(2026, 9, 25) as unknown as string,
            startTime: new Date(1970, 0, 1, 14, 30, 0) as unknown as string,
          }),
        ],
        1,
      ]);

      const result = await service.findAllBySiteId(SITE_ID, {});
      expect(result.data[0].date).toBe('2026-10-25');
      expect(result.data[0].time).toBe('14:30:00');
    });
  });
});
