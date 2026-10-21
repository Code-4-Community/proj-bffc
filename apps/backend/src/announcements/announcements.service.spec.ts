import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { Announcement } from '../entities/announcement.entity';
import { Site } from '../entities/site.entity';
import { User, UserType } from '../entities/user.entity';
import { AnnouncementsService } from './announcements.service';

const SITE_ID = '1a3cc442-d41f-421d-af8e-311781e6c033';

const steward = {
  id: 'steward-uuid',
  name: 'Jamie Chen',
  email: 'jamie@example.com',
  type: UserType.STEWARD,
} as User;

function announcement(
  overrides: Partial<Announcement> & { id: string; date: string },
): Announcement {
  return {
    info: 'Announcement body',
    steward,
    site: { id: SITE_ID } as Site,
    ...overrides,
  } as Announcement;
}

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let announcementRepo: { find: jest.Mock };
  let siteRepo: { exists: jest.Mock };

  beforeEach(async () => {
    announcementRepo = { find: jest.fn().mockResolvedValue([]) };
    siteRepo = { exists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: getRepositoryToken(Announcement),
          useValue: announcementRepo,
        },
        { provide: getRepositoryToken(Site), useValue: siteRepo },
      ],
    }).compile();

    service = module.get(AnnouncementsService);
  });

  describe('findAllBySiteId', () => {
    it('throws NotFoundException when the site does not exist', async () => {
      siteRepo.exists.mockResolvedValue(false);

      await expect(service.findAllBySiteId(SITE_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(announcementRepo.find).not.toHaveBeenCalled();
    });

    it('returns an empty array when the site has no announcements', async () => {
      announcementRepo.find.mockResolvedValue([]);

      await expect(service.findAllBySiteId(SITE_ID)).resolves.toEqual([]);
      expect(siteRepo.exists).toHaveBeenCalledWith({ where: { id: SITE_ID } });
    });

    it('maps content, date, and author without exposing steward email', async () => {
      announcementRepo.find.mockResolvedValue([
        announcement({
          id: 'ann-ripe',
          date: '2026-10-12',
          info: 'Paw paws are ripe — come pick this weekend.',
        }),
      ]);

      const [result] = await service.findAllBySiteId(SITE_ID);

      expect(result).toEqual({
        id: 'ann-ripe',
        content: 'Paw paws are ripe — come pick this weekend.',
        date: '2026-10-12',
        author: { id: steward.id, name: steward.name },
      });
      expect(result.author).not.toHaveProperty('email');
    });

    it('queries announcements for the site newest-first', async () => {
      await service.findAllBySiteId(SITE_ID);

      expect(announcementRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        relations: { steward: true },
        order: { date: 'DESC', id: 'DESC' },
      });
    });

    it('returns announcements in most-recent-first order', async () => {
      announcementRepo.find.mockResolvedValue([
        announcement({
          id: 'newer',
          date: '2026-10-12',
          info: 'Paw paws are ripe — come pick this weekend.',
        }),
        announcement({
          id: 'older',
          date: '2026-09-20',
          info: 'Path repairs scheduled for next week — expect partial closures.',
        }),
      ]);

      const results = await service.findAllBySiteId(SITE_ID);
      expect(results.map((row) => row.id)).toEqual(['newer', 'older']);
    });

    it('normalizes TypeORM Date objects into YYYY-MM-DD', async () => {
      announcementRepo.find.mockResolvedValue([
        announcement({
          id: 'date-obj',
          date: new Date(2026, 9, 12) as unknown as string,
        }),
      ]);

      const [result] = await service.findAllBySiteId(SITE_ID);
      expect(result.date).toBe('2026-10-12');
    });
  });
});
