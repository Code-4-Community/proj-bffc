/**
 * Seed script — populates the local database with realistic sample data
 * so GET endpoints return something meaningful during dev and in
 * Swagger's "Try it out".
 *
 * Setup:
 *   2. Add to package.json:
 *        "seed": "ts-node -r tsconfig-paths/register apps/backend/src/seed.ts"
 *   3. Run: yarn seed
 *
 * Uses your actual entities via TypeORM repositories, so relations
 * (site.steward, address.site, etc.) are wired up correctly rather
 * than relying on raw foreign key columns.
 *
 * NOTE: not run against a live DB by me — the GeoJSON Point assignment
 * on Address assumes TypeORM + PostGIS accepts a plain
 * { type: 'Point', coordinates: [lng, lat] } object for a `geometry`
 * column. If your setup needs a raw WKT string or ST_MakePoint via
 * query builder instead, swap that one block accordingly.
 */
import AppDataSource from './data-source';
import { User, UserType } from './entities/user.entity';
import { Site, SiteType } from './entities/site.entity';
import { Address } from './entities/address.entity';
import { Neighborhood } from './entities/neighborhood.entity';
import { Plant } from './entities/plant.entity';
import { Image } from './entities/image.entity';
import { Video } from './entities/video.entity';
import { Testimonial } from './entities/testimonial.entity';
import { PartnerOrg } from './entities/partner-org.entity';
import { AdminEvent } from './entities/admin-event.entity';
import { StewardEvent } from './entities/steward-event.entity';
import {
  RecurringEvent,
  RecurrenceFrequency,
} from './entities/recurring-event.entity';
import { EventException } from './entities/event-exception.entity';
import { Announcement } from './entities/announcement.entity';
import { MultiPolygon, Point } from 'geojson';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const siteRepo = AppDataSource.getRepository(Site);
  const addressRepo = AppDataSource.getRepository(Address);
  const neighborhoodRepo = AppDataSource.getRepository(Neighborhood);
  const plantRepo = AppDataSource.getRepository(Plant);
  const imageRepo = AppDataSource.getRepository(Image);
  const videoRepo = AppDataSource.getRepository(Video);
  const testimonialRepo = AppDataSource.getRepository(Testimonial);
  const partnerOrgRepo = AppDataSource.getRepository(PartnerOrg);
  const adminEventRepo = AppDataSource.getRepository(AdminEvent);
  const stewardEventRepo = AppDataSource.getRepository(StewardEvent);
  const recurringEventRepo = AppDataSource.getRepository(RecurringEvent);
  const eventExceptionRepo = AppDataSource.getRepository(EventException);
  const announcementRepo = AppDataSource.getRepository(Announcement);

  console.log('Seeding database...');

  const adminUser = await userRepo.save(
    userRepo.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      type: UserType.ADMIN,
    }),
  );

  const stewardUser = await userRepo.save(
    userRepo.create({
      name: 'Jamie Chen',
      email: 'jamie.chen@example.com',
      type: UserType.STEWARD,
    }),
  );

  // site1 is fully populated; site2 is deliberately partial so the
  // "populated vs. unpopulated fields" test case has real data to hit.
  const site1 = await siteRepo.save(
    siteRepo.create({
      name: 'Egleston Community Orchard',
      history:
        'Founded in 2012 on a formerly vacant lot, transformed by neighborhood volunteers into a thriving food forest.',
      accessibility:
        'Wheelchair accessible via Washington St entrance; gravel paths throughout.',
      foundingDate: '2012',
      hoursOpen: 'Sunrise to sunset',
      type: SiteType.EXISTING_COALITION,
      steward: adminUser,
    }),
  );

  const site2 = await siteRepo.save(
    siteRepo.create({
      name: 'Fowler Clark Epstein Farm',
      history:
        'A historic 1786 farmstead being revived as an emerging community land trust site.',
      accessibility: 'Uneven terrain; no paved paths yet.',
      type: SiteType.EMERGING_LAND_TRUST,
      steward: stewardUser,
    }),
  );

  // Neighborhoods — simplified rectangular boundaries around each site
  const jamaicaPlain = await neighborhoodRepo.save(
    neighborhoodRepo.create({
      name: 'Jamaica Plain',
      boundary: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-71.13, 42.295],
              [-71.095, 42.295],
              [-71.095, 42.325],
              [-71.13, 42.325],
              [-71.13, 42.295],
            ],
          ],
        ],
      } as MultiPolygon,
    }),
  );

  const dorchester = await neighborhoodRepo.save(
    neighborhoodRepo.create({
      name: 'Dorchester',
      boundary: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-71.09, 42.27],
              [-71.04, 42.27],
              [-71.04, 42.32],
              [-71.09, 42.32],
              [-71.09, 42.27],
            ],
          ],
        ],
      } as MultiPolygon,
    }),
  );

  // Addresses — Address is the owning side of the Site <-> Address relation
  await addressRepo.save(
    addressRepo.create({
      street: '196 Washington St',
      city: 'Boston',
      state: 'MA',
      zip: '02130',
      location: {
        type: 'Point',
        coordinates: [-71.1097, 42.3092],
      } as Point,
      site: site1,
      neighborhood: jamaicaPlain,
    }),
  );

  await addressRepo.save(
    addressRepo.create({
      street: '487 Norfolk St',
      city: 'Boston',
      state: 'MA',
      zip: '02124',
      location: {
        type: 'Point',
        coordinates: [-71.0827, 42.2887],
      } as Point,
      site: site2,
      neighborhood: dorchester,
    }),
  );

  // Plants — Paw Paw grows at both sites (many-to-many); Highbush
  // Blueberry has no image or recipes to test the empty cases
  await plantRepo.save([
    plantRepo.create({
      plantName: 'Paw Paw',
      imageS3Key: 'sites/egleston/plants/paw-paw.jpg',
      description:
        'A native understory tree producing the largest edible fruit in North America.',
      flavor: 'Tropical — like a mix of banana, mango, and custard',
      harvestSeason: 'Late August to early October',
      howToHarvest:
        'Gently squeeze; ripe fruit gives slightly like a peach and falls with a light tug.',
      recipes: ['Paw Paw Bread', 'Paw Paw Ice Cream'],
      hostSites: [site1, site2],
    }),
    plantRepo.create({
      plantName: 'American Persimmon',
      imageS3Key: 'sites/egleston/plants/american-persimmon.jpg',
      description:
        'A hardy native fruit tree whose fruit turns soft and sweet after the first frost.',
      flavor: 'Rich and honey-like, similar to a date',
      harvestSeason: 'October to November',
      howToHarvest:
        'Wait until the fruit is very soft and falls on its own, then collect from the ground.',
      recipes: ['Persimmon Pudding'],
      hostSites: [site1],
    }),
    plantRepo.create({
      plantName: 'Highbush Blueberry',
      description: 'A native shrub with clusters of small blue berries.',
      flavor: 'Sweet and slightly tart',
      harvestSeason: 'July to August',
      howToHarvest:
        'Roll ripe, fully blue berries off the cluster with your thumb.',
      hostSites: [site2],
    }),
  ]);

  // Images / videos — only site1 has media; site2 tests the empty-gallery case
  await imageRepo.save([
    imageRepo.create({ s3Key: 'sites/egleston/gallery-1.jpg', site: site1 }),
    imageRepo.create({ s3Key: 'sites/egleston/gallery-2.jpg', site: site1 }),
  ]);

  await videoRepo.save(
    videoRepo.create({ s3Key: 'sites/egleston/tour.mp4', site: site1 }),
  );

  // Testimonials — only site1, with a steward photo
  await testimonialRepo.save(
    testimonialRepo.create({
      question: 'Why do you volunteer here?',
      answer:
        'It’s the one place in the neighborhood where I feel connected to the land.',
      stewardImageS3Key: 'sites/egleston/testimonials/jamie-chen.jpg',
      site: site1,
    }),
  );

  // Partner orgs — Boston Food Forest Coalition partners with both sites
  // (many-to-many); The Trustees only partners with site2
  await partnerOrgRepo.save([
    partnerOrgRepo.create({
      name: 'Boston Food Forest Coalition',
      sites: [site1, site2],
    }),
    partnerOrgRepo.create({
      name: 'The Trustees of Reservations',
      sites: [site2],
    }),
  ]);

  // Admin events (Luma-linked, staff) — fully populated, incl. flyer
  await adminEventRepo.save(
    adminEventRepo.create({
      description: 'Fall Harvest Celebration',
      date: '2026-10-25',
      startTime: '14:00:00',
      endTime: '17:00:00',
      place: 'Egleston Community Orchard',
      registrationLink: 'https://lu.ma/example-harvest',
      flyerS3Key: 'sites/egleston/flyers/fall-harvest.pdf',
      site: site1,
    }),
  );

  // Steward events — has an end time but no flyer
  await stewardEventRepo.save(
    stewardEventRepo.create({
      description: 'Weekly Watering Shift',
      date: '2026-09-27',
      startTime: '09:00:00',
      endTime: '11:00:00',
      place: 'Fowler Clark Epstein Farm',
      site: site2,
      steward: stewardUser,
    }),
  );

  // Recurring events — site1's has an end date, end time, and flyer;
  // site2's repeats indefinitely with none of those, to test the null cases
  const [pruningWorkshop, communityWorkday] = await recurringEventRepo.save([
    recurringEventRepo.create({
      name: 'Monthly Orchard Pruning Workshop',
      description:
        'Learn seasonal pruning techniques for fruit trees. Tools provided.',
      startDate: '2026-11-07',
      startTime: '10:00:00',
      endTime: '12:00:00',
      place: 'Egleston Community Orchard',
      flyerS3Key: 'sites/egleston/flyers/pruning-workshop.pdf',
      frequency: RecurrenceFrequency.MONTHLY,
      endDate: '2027-04-03',
      site: site1,
    }),
    recurringEventRepo.create({
      name: 'Weekly Community Workday',
      description:
        'Drop-in volunteer workday — weeding, planting, and general upkeep.',
      startDate: '2026-10-24',
      startTime: '09:30:00',
      place: 'Fowler Clark Epstein Farm',
      frequency: RecurrenceFrequency.WEEKLY,
      site: site2,
    }),
  ]);

  // Event exceptions — one cancelled occurrence and one rescheduled one
  await eventExceptionRepo.save([
    eventExceptionRepo.create({
      event: communityWorkday,
      originalDate: '2026-11-14',
      cancelled: true,
      reason: 'Cancelled due to rain',
    }),
    eventExceptionRepo.create({
      event: pruningWorkshop,
      originalDate: '2026-12-05',
      cancelled: false,
      reason: 'Moved to the afternoon for warmer weather',
      newStartTime: new Date('2026-12-05T13:00:00-05:00'),
      newDuration: 90,
    }),
  ]);

  // Announcements — excluded from GET /site/{id} per the ticket, but
  // seeded anyway so that exclusion is actually testable
  await announcementRepo.save(
    announcementRepo.create({
      date: '2026-09-20',
      info: 'Path repairs scheduled for next week — expect partial closures.',
      steward: stewardUser,
      site: site1,
    }),
  );

  await AppDataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
