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

  constructor(@InjectRepository(Site) private siteRepo: Repository<Site>) {
    this.s3Region = process.env.AWS_REGION ?? 'us-east-2';
    this.s3Bucket = process.env.AWS_MEDIA_BUCKET_NAME ?? '';
  }

  async getMediaBySiteId(
    siteId: string,
    query: MediaQueryDto,
  ): Promise<MediaResponseDto> {
    const site = await this.siteRepo.findOne({
      where: { id: siteId },
      relations: ['images', 'images.uploadedBy', 'videos', 'videos.uploadedBy'],
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const { type, page, limit } = query;

    // Map + sort newest first. Totals are the full counts, captured before the
    // page slice so pagination metadata reflects everything available.
    const allImages = this.sortNewestFirst(
      (site.images ?? []).map((img) => this.mapToDto(img)),
    );
    const allVideos = this.sortNewestFirst(
      (site.videos ?? []).map((vid) => this.mapToDto(vid)),
    );

    const imagesTotal = allImages.length;
    const videosTotal = allVideos.length;

    const skip = (page - 1) * limit;
    const images =
      type === MediaType.VIDEO ? [] : allImages.slice(skip, skip + limit);
    const videos =
      type === MediaType.IMAGE ? [] : allVideos.slice(skip, skip + limit);

    return {
      images,
      videos,
      pagination: { page, limit, imagesTotal, videosTotal },
    };
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

  private sortNewestFirst(items: MediaItemDto[]): MediaItemDto[] {
    return items.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    );
  }

  private buildS3Url(s3Key: string): string {
    if (!this.s3Bucket) {
      return s3Key;
    }
    return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${s3Key}`;
  }
}
