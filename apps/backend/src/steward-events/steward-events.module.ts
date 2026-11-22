import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StewardEventsController } from './steward-events.controller';
import { StewardEventsService } from './steward-events.service';
import { StewardEvent } from '../entities/steward-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StewardEvent])],
  controllers: [StewardEventsController],
  providers: [StewardEventsService],
})
export class StewardEventsModule {}
