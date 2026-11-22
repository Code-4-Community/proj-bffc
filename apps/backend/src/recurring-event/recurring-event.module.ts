import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { Site } from '../entities/site.entity';
import { RecurringEventController } from './recurring-event.controller';
import { RecurringEventService } from './recurring-event.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEvent, Site])],
  controllers: [RecurringEventController],
  providers: [RecurringEventService],
  exports: [RecurringEventService],
})
export class RecurringEventModule {}
