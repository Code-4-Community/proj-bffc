import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RecurringEvent } from '../entities/recurring-event.entity';
import { Site } from '../entities/site.entity';
import {
  RecurringEventQueryDto,
  SortOrder,
} from './dto/recurring-event-query.dto';
import {
  PaginatedRecurringEventsDto,
  RecurringEventResponseDto,
} from './dto/recurring-event-response.dto';

@Injectable()
export class RecurringEventService {
  constructor(
    @InjectRepository(RecurringEvent)
    private readonly recurringEventRepo: Repository<RecurringEvent>,
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
  ) {}

  /**
   * All recurring events for `siteId`, sorted by date with pagination.
   * Unknown site -> 404. Known site with no events -> empty data array.
   */
  async findAllBySiteId(
    siteId: string,
    query: RecurringEventQueryDto,
  ): Promise<PaginatedRecurringEventsDto> {
    const siteExists = await this.siteRepo.exists({ where: { id: siteId } });
    if (!siteExists) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const order = query.order === SortOrder.DESC ? 'DESC' : 'ASC';
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const [events, total] = await this.recurringEventRepo.findAndCount({
      where: { site: { id: siteId } },
      relations: { site: true },
      order: { startDate: order, startTime: order, id: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: events.map((event) => this.mapToDto(event)),
      total,
      page,
      limit,
    };
  }

  private mapToDto(event: RecurringEvent): RecurringEventResponseDto {
    return {
      id: event.id,
      site: { id: event.site.id, name: event.site.name },
      name: event.name,
      date: normalizeDate(event.startDate),
      time: normalizeTime(event.startTime),
      description: event.description,
      place: event.place,
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
  const match = asString.match(/(\d{2}:\d{2}:\d{2})/);
  return match ? match[1] : asString.slice(0, 8);
}
