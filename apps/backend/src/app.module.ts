import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import AppDataSource from './data-source';
import { CognitoModule } from './aws/cognito/cognito.module';
import { UsersModule } from './users/users.module';
import { StewardEventsModule } from './steward-events/steward-events.module';
import { SitesModule } from './sites/sites.module';
import { EventsModule } from './events/events.module';
import { MediaModule } from './media/media.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { PlantsModule } from './plants/plants.module';
import { AWSS3Module } from './aws/s3/aws-s3.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      migrations: [],
      migrationsRun: false,
    }),
    CognitoModule,
    AWSS3Module,
    UsersModule,
    StewardEventsModule,
    SitesModule,
    EventsModule,
    AnnouncementsModule,
    MediaModule,
    PlantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
