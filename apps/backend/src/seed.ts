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
import { PlantInventory } from './entities/plant-inventory.entity';
import { Image } from './entities/image.entity';
import { Video } from './entities/video.entity';
import { Testimonial } from './entities/testimonial.entity';
import { PartnerOrg } from './entities/partner-org.entity';
import { VolunteerOpportunity } from './entities/volunteer-opportunity.entity';
import { AdminEvent } from './entities/admin-event.entity';
import { StewardEvent } from './entities/steward-event.entity';
import { Announcement } from './entities/announcement.entity';
import { Point } from 'geojson';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const siteRepo = AppDataSource.getRepository(Site);
  const addressRepo = AppDataSource.getRepository(Address);
  const plantRepo = AppDataSource.getRepository(PlantInventory);
  const imageRepo = AppDataSource.getRepository(Image);
  const videoRepo = AppDataSource.getRepository(Video);
  const testimonialRepo = AppDataSource.getRepository(Testimonial);
  const partnerOrgRepo = AppDataSource.getRepository(PartnerOrg);
  const volunteerRepo = AppDataSource.getRepository(VolunteerOpportunity);
  const adminEventRepo = AppDataSource.getRepository(AdminEvent);
  const stewardEventRepo = AppDataSource.getRepository(StewardEvent);
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
    }),
  );

  // Plant inventory — site1 has two, site2 has one
  await plantRepo.save([
    plantRepo.create({ plantName: 'Paw Paw', site: site1 }),
    plantRepo.create({ plantName: 'American Persimmon', site: site1 }),
    plantRepo.create({ plantName: 'Highbush Blueberry', site: site2 }),
  ]);

  // Images / videos — only site1 has media; site2 tests the empty-gallery case
  await imageRepo.save([
    imageRepo.create({ s3Key: 'sites/egleston/gallery-1.jpg', site: site1 }),
    imageRepo.create({ s3Key: 'sites/egleston/gallery-2.jpg', site: site1 }),
  ]);

  await videoRepo.save(
    videoRepo.create({ s3Key: 'sites/egleston/tour.mp4', site: site1 }),
  );

  // Testimonials — only site1
  await testimonialRepo.save(
    testimonialRepo.create({
      question: 'Why do you volunteer here?',
      answer:
        'It’s the one place in the neighborhood where I feel connected to the land.',
      site: site1,
    }),
  );

  // Partner orgs — only site2, so site1 tests the empty case
  await partnerOrgRepo.save(
    partnerOrgRepo.create({
      name: 'The Trustees of Reservations',
      site: site2,
    }),
  );

  // Volunteer opportunities
  await volunteerRepo.save(
    volunteerRepo.create({
      name: 'Fall Mulching Day',
      date: '2026-10-18',
      site: site1,
    }),
  );

  // Admin events (Luma-linked, staff)
  await adminEventRepo.save(
    adminEventRepo.create({
      description: 'Fall Harvest Celebration',
      date: '2026-10-25',
      time: '14:00:00',
      place: 'Egleston Community Orchard',
      registrationLink: 'https://lu.ma/example-harvest',
      site: site1,
    }),
  );

  // Steward events
  await stewardEventRepo.save(
    stewardEventRepo.create({
      description: 'Weekly Watering Shift',
      date: '2026-09-27',
      time: '09:00:00',
      place: 'Fowler Clark Epstein Farm',
      site: site2,
      steward: stewardUser,
    }),
  );

  // Announcements — excluded from GET /site/{id}; listed by
  // GET /announcement/{site_id}. site1 has two (newest first);
  // site2 is left empty so that endpoint can return [].
  await announcementRepo.save([
    announcementRepo.create({
      date: '2026-09-20',
      info: 'Path repairs scheduled for next week — expect partial closures.',
      steward: stewardUser,
      site: site1,
    }),
    announcementRepo.create({
      date: '2026-10-12',
      info: 'Paw paws are ripe — come pick this weekend.',
      steward: stewardUser,
      site: site1,
    }),
  ]);

  await AppDataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
