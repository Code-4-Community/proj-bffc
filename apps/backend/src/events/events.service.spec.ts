import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { Site } from '../entities/site.entity';
import { StewardEvent } from '../entities/steward-event.entity';
import { EventsService } from './events.service';
import { EventSourceType } from './events.types';

const SITE_A = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Egleston',
} as Site;
const SITE_B = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Fowler Clark',
} as Site;

function adminEvent(
  overrides: Partial<AdminEvent> & { id: string; date: string; time: string },
): AdminEvent {
  return {
    name: 'Harvest',
    description: 'Harvest description',
    eventType: 'harvest',
    place: 'Orchard',
    registrationLink: 'https://lu.ma/harvest',
    site: SITE_A,
    ...overrides,
  } as AdminEvent;
}

function stewardEvent(
  overrides: Partial<StewardEvent> & { id: string; date: string; time: string },
): StewardEvent {
  return {
    name: 'Watering',
    description: 'Watering description',
    eventType: 'volunteer',
    place: 'Farm',
    site: SITE_B,
    ...overrides,
  } as StewardEvent;
}

describe('EventsService', () => {
  let service: EventsService;
  let adminRepo: { find: jest.Mock };
  let stewardRepo: { find: jest.Mock };

  const lumaEvents = [
    adminEvent({
      id: 'a-late',
      date: '2026-11-08',
      time: '11:00:00',
      name: 'Winter Planning Workshop',
      description: 'Staff-led workshop',
      eventType: 'workshop',
      registrationLink: 'https://lu.ma/workshop',
      site: SITE_B,
    }),
    adminEvent({
      id: 'a-early',
      date: '2026-10-25',
      time: '14:00:00',
      name: 'Fall Harvest Celebration',
      description: 'Cider and potluck',
      eventType: 'harvest',
      registrationLink: 'https://lu.ma/harvest',
      site: SITE_A,
    }),
  ];

  const stewardEvents = [
    stewardEvent({
      id: 's-mid',
      date: '2026-10-04',
      time: '10:00:00',
      name: 'Mulch & Path Work Day',
      description: 'Spread wood chips',
      eventType: 'volunteer',
      site: SITE_A,
    }),
    stewardEvent({
      id: 's-early',
      date: '2026-09-27',
      time: '09:00:00',
      name: 'Weekly Watering Shift',
      description: 'Open watering shift',
      eventType: 'volunteer',
      site: SITE_B,
    }),
  ];

  beforeEach(async () => {
    adminRepo = { find: jest.fn().mockResolvedValue(lumaEvents) };
    stewardRepo = { find: jest.fn().mockResolvedValue(stewardEvents) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(AdminEvent), useValue: adminRepo },
        { provide: getRepositoryToken(StewardEvent), useValue: stewardRepo },
      ],
    }).compile();

    service = moduleRef.get(EventsService);
  });

  describe('findAllForAdmin', () => {
    it('returns the full mapped shape for Luma and steward events', async () => {
      const results = await service.findAllForAdmin({});
      const harvest = results.find((event) => event.id === 'a-early');
      const watering = results.find((event) => event.id === 's-early');

      expect(harvest).toEqual({
        id: 'a-early',
        site: { id: SITE_A.id, name: SITE_A.name },
        name: 'Fall Harvest Celebration',
        date: '2026-10-25',
        time: '14:00:00',
        description: 'Cider and potluck',
        eventType: 'harvest',
        sourceType: EventSourceType.LUMA,
        registrationLink: 'https://lu.ma/harvest',
      });
      expect(watering).toEqual({
        id: 's-early',
        site: { id: SITE_B.id, name: SITE_B.name },
        name: 'Weekly Watering Shift',
        date: '2026-09-27',
        time: '09:00:00',
        description: 'Open watering shift',
        eventType: 'volunteer',
        sourceType: EventSourceType.STEWARD,
      });
      expect(watering).not.toHaveProperty('registrationLink');
    });

    it('returns events in chronological order (date, then time)', async () => {
      const results = await service.findAllForAdmin({});

      expect(results.map((event) => event.id)).toEqual([
        's-early',
        's-mid',
        'a-early',
        'a-late',
      ]);
    });

    it('sorts same-day events by time, then id', async () => {
      adminRepo.find.mockResolvedValue([
        adminEvent({
          id: 'same-day-late',
          date: '2026-10-25',
          time: '16:00:00',
        }),
        adminEvent({
          id: 'same-day-early',
          date: '2026-10-25',
          time: '08:00:00',
        }),
      ]);
      stewardRepo.find.mockResolvedValue([
        stewardEvent({
          id: 'same-day-mid',
          date: '2026-10-25',
          time: '08:00:00',
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
          time: new Date(2026, 9, 25, 14, 30, 5) as unknown as string,
        }),
      ]);
      stewardRepo.find.mockResolvedValue([]);

      const [event] = await service.findAllForAdmin({});
      expect(event.date).toBe('2026-10-25');
      expect(event.time).toBe('14:30:05');
    });

    it('filters by site_id across both sources', async () => {
      await service.findAllForAdmin({ site_id: SITE_A.id });

      expect(adminRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_A.id } },
        relations: { site: true },
      });
      expect(stewardRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_A.id } },
        relations: { site: true },
      });
    });

    it('filters by event_type', async () => {
      await service.findAllForAdmin({ event_type: 'harvest' });

      expect(adminRepo.find).toHaveBeenCalledWith({
        where: { eventType: 'harvest' },
        relations: { site: true },
      });
      expect(stewardRepo.find).toHaveBeenCalledWith({
        where: { eventType: 'harvest' },
        relations: { site: true },
      });
    });

    it('queries only Luma events when source_type=luma', async () => {
      const results = await service.findAllForAdmin({
        source_type: EventSourceType.LUMA,
      });

      expect(adminRepo.find).toHaveBeenCalled();
      expect(stewardRepo.find).not.toHaveBeenCalled();
      expect(
        results.every((event) => event.sourceType === EventSourceType.LUMA),
      ).toBe(true);
    });

    it('queries only steward events when source_type=steward', async () => {
      const results = await service.findAllForAdmin({
        source_type: EventSourceType.STEWARD,
      });

      expect(stewardRepo.find).toHaveBeenCalled();
      expect(adminRepo.find).not.toHaveBeenCalled();
      expect(
        results.every((event) => event.sourceType === EventSourceType.STEWARD),
      ).toBe(true);
    });

    it('combines site_id, event_type, and source_type filters', async () => {
      await service.findAllForAdmin({
        site_id: SITE_A.id,
        event_type: 'volunteer',
        source_type: EventSourceType.STEWARD,
      });

      expect(adminRepo.find).not.toHaveBeenCalled();
      expect(stewardRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_A.id }, eventType: 'volunteer' },
        relations: { site: true },
      });
    });

    it('returns an empty list when nothing matches', async () => {
      adminRepo.find.mockResolvedValue([]);
      stewardRepo.find.mockResolvedValue([]);

      await expect(
        service.findAllForAdmin({ event_type: 'does-not-exist' }),
      ).resolves.toEqual([]);
    });

    it('omits registrationLink when the Luma event has an empty link', async () => {
      adminRepo.find.mockResolvedValue([
        adminEvent({
          id: 'a-no-link',
          date: '2026-10-01',
          time: '12:00:00',
          registrationLink: '',
        }),
      ]);
      stewardRepo.find.mockResolvedValue([]);

      const [event] = await service.findAllForAdmin({});
      expect(event).not.toHaveProperty('registrationLink');
    });
  });
});
