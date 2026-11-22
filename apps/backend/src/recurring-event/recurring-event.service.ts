import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { Site } from '../entities/site.entity';
import {
  RecurringEventQueryDto,
  SortOrder,
} from './dto/recurring-event-query.dto';
import { RecurringEventResponseDto } from './dto/recurring-event-response.dto';

@Injectable()
export class RecurringEventService {
  constructor(
    @InjectRepository(AdminEvent)
    private readonly adminEventRepo: Repository<AdminEvent>,
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
  ) {}

  /**
   * All recurring events for `siteId`, sorted by date.
   * Unknown site -> 404. Known site with no events -> `[]`.
   */
  async findAllBySiteId(
    siteId: string,
    query: RecurringEventQueryDto,
  ): Promise<RecurringEventResponseDto[]> {
    const siteExists = await this.siteRepo.exists({ where: { id: siteId } });
    if (!siteExists) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const order = query.order === SortOrder.DESC ? 'DESC' : 'ASC';
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const events = await this.adminEventRepo.find({
      where: { site: { id: siteId } },
      relations: { site: true },
      order: { date: order, time: order, id: 'ASC' },
      skip,
      take: limit,
    });

    return events.map((event) => this.mapToDto(event));
  }

  private mapToDto(event: AdminEvent): RecurringEventResponseDto {
    const dto: RecurringEventResponseDto = {
      id: event.id,
      site: { id: event.site.id, name: event.site.name },
      name: event.name,
      date: normalizeDate(event.date),
      time: normalizeTime(event.time),
      description: event.description,
      place: event.place,
    };
    if (event.registrationLink) {
      dto.registrationLink = event.registrationLink;
    }
    return dto;
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
