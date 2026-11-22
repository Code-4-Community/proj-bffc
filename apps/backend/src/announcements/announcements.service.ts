import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Announcement } from '../entities/announcement.entity';
import { Site } from '../entities/site.entity';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
  ) {}

  /**
   * All announcements for `siteId`, newest published date first.
   * Unknown site → 404. Known site with none → `[]`.
   */
  async findAllBySiteId(siteId: string): Promise<AnnouncementResponseDto[]> {
    const siteExists = await this.siteRepo.exists({ where: { id: siteId } });
    if (!siteExists) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const announcements = await this.announcementRepo.find({
      where: { site: { id: siteId } },
      relations: { steward: true },
      order: { date: 'DESC', id: 'DESC' },
    });

    return announcements.map((announcement) => this.mapToDto(announcement));
  }

  private mapToDto(announcement: Announcement): AnnouncementResponseDto {
    return {
      id: announcement.id,
      content: announcement.info,
      date: normalizeDate(announcement.date),
      author: {
        id: announcement.steward.id,
        name: announcement.steward.name,
      },
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
