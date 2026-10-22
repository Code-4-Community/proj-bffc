import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StewardEvent } from '../entities/steward-event.entity';
import { StewardEventResponseDto } from './dto/steward-event-response.dto';

@Injectable()
export class StewardEventsService {
  constructor(
    @InjectRepository(StewardEvent)
    private stewardEventRepo: Repository<StewardEvent>,
  ) {}

  async findBySite(siteId: string): Promise<StewardEventResponseDto[]> {
    // No relations are loaded, so each event holds only its own columns
    const events = await this.stewardEventRepo.find({
      where: { site: { id: siteId } },
      order: { date: 'ASC', time: 'ASC' },
    });
    return events.map((event) => ({ ...event, eventType: 'steward' }));
  }
}
