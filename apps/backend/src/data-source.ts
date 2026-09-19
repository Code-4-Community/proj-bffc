import { DataSource } from 'typeorm';
import { PluralNamingStrategy } from './strategies/plural-naming.strategy';
import * as dotenv from 'dotenv';

import { User } from './entities/user.entity';
import { Site } from './entities/site.entity';
import { AdminEvent } from './entities/admin-event.entity';
import { StewardEvent } from './entities/steward-event.entity';
import { PlantInventory } from './entities/plant-inventory.entity';
import { Image } from './entities/image.entity';
import { Video } from './entities/video.entity';
import { Testimonial } from './entities/testimonial.entity';
import { Announcement } from './entities/announcement.entity';
import { PartnerOrg } from './entities/partner-org.entity';
import { VolunteerOpportunity } from './entities/volunteer-opportunity.entity';
import { Address } from './entities/address.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.NX_DB_HOST,
  port: parseInt(process.env.NX_DB_PORT as string, 10),
  username: process.env.NX_DB_USERNAME,
  password: process.env.NX_DB_PASSWORD,
  database: process.env.NX_DB_DATABASE,
  entities: [
    User,
    Site,
    AdminEvent,
    StewardEvent,
    PlantInventory,
    Image,
    Video,
    Testimonial,
    Announcement,
    PartnerOrg,
    VolunteerOpportunity,
    Address,
  ],
  migrations: ['apps/backend/src/migrations/*.ts'],
  // Setting synchronize: true shouldn't be used in production - otherwise you can lose production data
  synchronize: false,
  namingStrategy: new PluralNamingStrategy(),
});

export default AppDataSource;
