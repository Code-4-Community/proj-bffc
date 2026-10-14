import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { StewardEvent } from '../entities/steward-event.entity';
import { AdminEventQueryDto } from './dto/admin-event-query.dto';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';
import { EventSourceType } from './events.types';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(AdminEvent)
    private readonly adminEventRepo: Repository<AdminEvent>,
    @InjectRepository(StewardEvent)
    private readonly stewardEventRepo: Repository<StewardEvent>,
  ) {}

  /**
   * Returns every Luma-linked and steward-run event that matches `filters`,
   * mapped to a shared DTO and sorted by date then time (earliest first).
   * An empty array means no rows matched — not an error.
   */
  async findAllForAdmin(
    filters: AdminEventQueryDto,
  ): Promise<AdminEventResponseDto[]> {
    const includeLuma =
      !filters.source_type || filters.source_type === EventSourceType.LUMA;
    const includeSteward =
      !filters.source_type || filters.source_type === EventSourceType.STEWARD;

    const [adminEvents, stewardEvents] = await Promise.all([
      includeLuma
        ? this.adminEventRepo.find({
            where: this.buildWhere(filters),
            relations: { site: true },
          })
        : Promise.resolve([] as AdminEvent[]),
      includeSteward
        ? this.stewardEventRepo.find({
            where: this.buildWhere(filters),
            relations: { site: true },
          })
        : Promise.resolve([] as StewardEvent[]),
    ]);

    const combined: AdminEventResponseDto[] = [
      ...adminEvents.map((event) => this.mapAdminEvent(event)),
      ...stewardEvents.map((event) => this.mapStewardEvent(event)),
    ];

    combined.sort((a, b) => compareChronological(a, b));
    return combined;
  }

  private buildWhere(
    filters: AdminEventQueryDto,
  ): FindOptionsWhere<AdminEvent> & FindOptionsWhere<StewardEvent> {
    const where: FindOptionsWhere<AdminEvent> & FindOptionsWhere<StewardEvent> =
      {};
    if (filters.site_id) {
      where.site = { id: filters.site_id };
    }
    if (filters.event_type) {
      where.eventType = filters.event_type;
    }
    return where;
  }

  private mapAdminEvent(event: AdminEvent): AdminEventResponseDto {
    const dto: AdminEventResponseDto = {
      id: event.id,
      site: { id: event.site.id, name: event.site.name },
      name: event.name,
      date: normalizeDate(event.date),
      time: normalizeTime(event.time),
      description: event.description,
      eventType: event.eventType,
      sourceType: EventSourceType.LUMA,
    };
    if (event.registrationLink) {
      dto.registrationLink = event.registrationLink;
    }
    return dto;
  }

  private mapStewardEvent(event: StewardEvent): AdminEventResponseDto {
    return {
      id: event.id,
      site: { id: event.site.id, name: event.site.name },
      name: event.name,
      date: normalizeDate(event.date),
      time: normalizeTime(event.time),
      description: event.description,
      eventType: event.eventType,
      sourceType: EventSourceType.STEWARD,
    };
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeDate(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(
      value.getDate(),
    )}`;
  }
  return String(value).slice(0, 10);
}

function normalizeTime(value: string | Date): string {
  if (value instanceof Date) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(
      value.getSeconds(),
    )}`;
  }
  const asString = String(value);
  // TIME columns typically come back as "HH:MM:SS".
  const match = asString.match(/(\d{2}:\d{2}:\d{2})/);
  return match ? match[1] : asString.slice(0, 8);
}

function compareChronological(
  a: Pick<AdminEventResponseDto, 'date' | 'time' | 'id'>,
  b: Pick<AdminEventResponseDto, 'date' | 'time' | 'id'>,
): number {
  const byDateTime = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  if (byDateTime !== 0) {
    return byDateTime;
  }
  return a.id.localeCompare(b.id);
}
