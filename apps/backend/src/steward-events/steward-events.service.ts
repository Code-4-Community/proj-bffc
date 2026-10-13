import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StewardEvent } from '../entities/steward-event.entity';
import {
  STEWARD_EVENT_TYPE,
  StewardEventResponseDto,
} from './dto/steward-event-response.dto';

@Injectable()
export class StewardEventsService {
  constructor(
    @InjectRepository(StewardEvent)
    private stewardEventRepo: Repository<StewardEvent>,
  ) {}

  async findBySite(siteId: string): Promise<StewardEventResponseDto[]> {
    const events = await this.stewardEventRepo.find({
      where: { site: { id: siteId } },
      order: { date: 'ASC', time: 'ASC' },
    });

    return events.map((event) => this.mapToDto(event));
  }

  private mapToDto(event: StewardEvent): StewardEventResponseDto {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      time: event.time,
      place: event.place,
      eventType: STEWARD_EVENT_TYPE,
    };
  }
}
