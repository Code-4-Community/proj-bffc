import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../entities/site.entity';
import { Image } from '../entities/image.entity';
import { Video } from '../entities/video.entity';
import { MediaItemDto } from './dto/media-item.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaQueryDto, MediaType } from './dto/media-query.dto';

@Injectable()
export class MediaService {
  private readonly s3Region: string;
  private readonly s3Bucket: string;

  constructor(
    @InjectRepository(Site) private siteRepo: Repository<Site>,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
    @InjectRepository(Video) private videoRepo: Repository<Video>,
  ) {
    this.s3Region = process.env.AWS_REGION ?? 'us-east-2';
    this.s3Bucket = process.env.AWS_MEDIA_BUCKET_NAME ?? '';
  }

  async getMediaBySiteId(
    siteId: string,
    query: MediaQueryDto,
  ): Promise<MediaResponseDto> {
    const siteExists = await this.siteRepo.exists({ where: { id: siteId } });

    if (!siteExists) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const { type, page, limit } = query;
    const skip = (page - 1) * limit;

    // Totals are always the full counts, even for a type that is excluded from the page.
    const [[images, imagesTotal], [videos, videosTotal]] = await Promise.all([
      this.fetchPage(
        this.imageRepo,
        siteId,
        skip,
        limit,
        type !== MediaType.VIDEO,
      ),
      this.fetchPage(
        this.videoRepo,
        siteId,
        skip,
        limit,
        type !== MediaType.IMAGE,
      ),
    ]);

    return {
      images,
      videos,
      pagination: { page, limit, imagesTotal, videosTotal },
    };
  }

  private async fetchPage(
    repo: Repository<Image> | Repository<Video>,
    siteId: string,
    skip: number,
    take: number,
    includeItems: boolean,
  ): Promise<[MediaItemDto[], number]> {
    const where = { site: { id: siteId } };

    if (!includeItems) {
      return [[], await repo.count({ where })];
    }

    const [items, total] = await (
      repo as Repository<Image | Video>
    ).findAndCount({
      where,
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC', id: 'ASC' },
      skip,
      take,
    });
    return [items.map((item) => this.mapToDto(item)), total];
  }

  private mapToDto(media: Image | Video): MediaItemDto {
    return {
      id: media.id,
      url: this.buildS3Url(media.s3Key),
      title: media.title ?? null,
      description: media.description ?? null,
      uploadedAt: media.uploadedAt,
      uploadedBy: media.uploadedBy?.name ?? null,
    };
  }

  private buildS3Url(s3Key: string): string {
    if (!this.s3Bucket) {
      return s3Key;
    }
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${s3Key}`;
  }
}
