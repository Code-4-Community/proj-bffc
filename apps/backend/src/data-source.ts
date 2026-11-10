import { DataSource } from 'typeorm';
import { PluralNamingStrategy } from './strategies/plural-naming.strategy';
import * as dotenv from 'dotenv';

import { User } from './entities/user.entity';
import { Site } from './entities/site.entity';
import { AdminEvent } from './entities/admin-event.entity';
import { StewardEvent } from './entities/steward-event.entity';
import { RecurringEvent } from './entities/recurring-event.entity';
import { Plant } from './entities/plant.entity';
import { Image } from './entities/image.entity';
import { Video } from './entities/video.entity';
import { Testimonial } from './entities/testimonial.entity';
import { Announcement } from './entities/announcement.entity';
import { PartnerOrg } from './entities/partner-org.entity';
import { Address } from './entities/address.entity';
import { Neighborhood } from './entities/neighborhood.entity';
import { EventException } from './entities/event-exception.entity';

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
    RecurringEvent,
    Plant,
    Image,
    Video,
    Testimonial,
    Announcement,
    PartnerOrg,
    Address,
    Neighborhood,
    EventException,
  ],
  migrations: ['apps/backend/src/migrations/*.ts'],
  // Setting synchronize: true shouldn't be used in production - otherwise you can lose production data
  synchronize: false,
  namingStrategy: new PluralNamingStrategy(),
});

export default AppDataSource;
