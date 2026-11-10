import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { AdminEvent } from '../entities/admin-event.entity';
import { AdminEventQueryDto } from './dto/admin-event-query.dto';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(AdminEvent)
    private readonly adminEventRepo: Repository<AdminEvent>,
  ) {}

  /**
   * Returns Luma-linked admin events that match `filters`, sorted by date
   * then time (earliest first). An empty array means no rows matched.
   */
  async findAllForAdmin(
    filters: AdminEventQueryDto,
  ): Promise<AdminEventResponseDto[]> {
    const events = await this.adminEventRepo.find({
      where: this.buildWhere(filters),
      relations: { site: true },
    });

    const mapped = events.map((event) => this.mapAdminEvent(event));
    mapped.sort((a, b) => compareChronological(a, b));
    return mapped;
  }

  private buildWhere(
    filters: AdminEventQueryDto,
  ): FindOptionsWhere<AdminEvent> {
    const where: FindOptionsWhere<AdminEvent> = {};
    if (filters.site_id) {
      where.site = { id: filters.site_id };
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
