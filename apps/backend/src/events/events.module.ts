import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEvent])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
