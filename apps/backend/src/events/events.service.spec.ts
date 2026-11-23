import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { Site } from '../entities/site.entity';
import { EventsService } from './events.service';

const SITE_A = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Egleston',
} as Site;
const SITE_B = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Fowler Clark',
} as Site;

function adminEvent(
  overrides: Partial<AdminEvent> & {
    id: string;
    date: string;
    startTime: string;
  },
): AdminEvent {
  return {
    name: 'Harvest',
    description: 'Harvest description',
    place: 'Orchard',
    registrationLink: 'https://lu.ma/harvest',
    site: SITE_A,
    ...overrides,
  } as AdminEvent;
}

describe('EventsService', () => {
  let service: EventsService;
  let adminRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let siteRepo: { findOne: jest.Mock };

  const lumaEvents = [
    adminEvent({
      id: 'a-late',
      date: '2026-11-08',
      startTime: '11:00:00',
      name: 'Winter Planning Workshop',
      description: 'Staff-led workshop',
      registrationLink: 'https://lu.ma/workshop',
      site: SITE_B,
    }),
    adminEvent({
      id: 'a-early',
      date: '2026-10-25',
      startTime: '14:00:00',
      name: 'Fall Harvest Celebration',
      description: 'Cider and potluck',
      registrationLink: 'https://lu.ma/harvest',
      site: SITE_A,
    }),
  ];

  beforeEach(async () => {
    adminRepo = {
      find: jest.fn().mockResolvedValue(lumaEvents),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 'new-id', ...x })),
    };
    siteRepo = { findOne: jest.fn().mockResolvedValue(SITE_A) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(AdminEvent), useValue: adminRepo },
        { provide: getRepositoryToken(Site), useValue: siteRepo },
      ],
    }).compile();

    service = moduleRef.get(EventsService);
  });

  describe('findAllForAdmin', () => {
    it('returns the full mapped shape for admin events', async () => {
      const results = await service.findAllForAdmin({});
      const harvest = results.find((event) => event.id === 'a-early');

      expect(harvest).toEqual({
        id: 'a-early',
        site: { id: SITE_A.id, name: SITE_A.name },
        name: 'Fall Harvest Celebration',
        date: '2026-10-25',
        time: '14:00:00',
        description: 'Cider and potluck',
        place: 'Orchard',
        registrationLink: 'https://lu.ma/harvest',
      });
      expect(harvest).not.toHaveProperty('eventType');
      expect(harvest).not.toHaveProperty('sourceType');
    });

    it('returns events in chronological order (date, then time)', async () => {
      const results = await service.findAllForAdmin({});

      expect(results.map((event) => event.id)).toEqual(['a-early', 'a-late']);
    });

    it('sorts same-day events by time, then id', async () => {
      adminRepo.find.mockResolvedValue([
        adminEvent({
          id: 'same-day-late',
          date: '2026-10-25',
          startTime: '16:00:00',
        }),
        adminEvent({
          id: 'same-day-early',
          date: '2026-10-25',
          startTime: '08:00:00',
        }),
        adminEvent({
          id: 'same-day-mid',
          date: '2026-10-25',
          startTime: '08:00:00',
        }),
      ]);

      const results = await service.findAllForAdmin({});
      expect(results.map((event) => event.id)).toEqual([
        'same-day-early',
        'same-day-mid',
        'same-day-late',
      ]);
    });

    it('normalizes TypeORM Date objects into date and time strings', async () => {
      adminRepo.find.mockResolvedValue([
        adminEvent({
          id: 'date-obj',
          date: new Date(2026, 9, 25) as unknown as string,
          startTime: new Date(2026, 9, 25, 14, 30, 5) as unknown as string,
        }),
      ]);

      const [event] = await service.findAllForAdmin({});
      expect(event.date).toBe('2026-10-25');
      expect(event.time).toBe('14:30:05');
    });

    it('filters by site_id', async () => {
      await service.findAllForAdmin({ site_id: SITE_A.id });

      expect(adminRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_A.id } },
        relations: { site: true },
      });
    });

    it('returns an empty list when nothing matches', async () => {
      adminRepo.find.mockResolvedValue([]);

      await expect(
        service.findAllForAdmin({ site_id: SITE_B.id }),
      ).resolves.toEqual([]);
    });

    it('omits registrationLink when the event has an empty link', async () => {
      adminRepo.find.mockResolvedValue([
        adminEvent({
          id: 'a-no-link',
          date: '2026-10-01',
          startTime: '12:00:00',
          registrationLink: '',
        }),
      ]);

      const [event] = await service.findAllForAdmin({});
      expect(event).not.toHaveProperty('registrationLink');
    });
  });

  describe('createAdminEvent', () => {
    const dto = {
      site_id: SITE_A.id,
      name: 'Fall Harvest',
      description: 'Cider and potluck',
      place: 'Orchard',
      date: '2026-10-25',
      startTime: '14:00',
      endTime: '16:00:00',
      registrationLink: 'https://lu.ma/harvest',
    };

    it('saves the event on the site and returns the mapped event', async () => {
      const result = await service.createAdminEvent(dto);

      expect(siteRepo.findOne).toHaveBeenCalledWith({
        where: { id: SITE_A.id },
      });
      expect(adminRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          site: SITE_A,
          name: 'Fall Harvest',
          registrationLink: 'https://lu.ma/harvest',
        }),
      );
      expect(result).toEqual({
        id: 'new-id',
        site: { id: SITE_A.id, name: SITE_A.name },
        name: 'Fall Harvest',
        date: '2026-10-25',
        time: '14:00',
        endTime: '16:00:00',
        description: 'Cider and potluck',
        place: 'Orchard',
        registrationLink: 'https://lu.ma/harvest',
      });
    });

    it('throws NotFoundException and saves nothing for an unknown site', async () => {
      siteRepo.findOne.mockResolvedValue(null);

      await expect(service.createAdminEvent(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(adminRepo.save).not.toHaveBeenCalled();
    });
  });
});
