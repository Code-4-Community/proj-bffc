import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Site } from '../entities/site.entity';
import { Image } from '../entities/image.entity';
import { Video } from '../entities/video.entity';
import { User, UserType } from '../entities/user.entity';
import {
  AccessTokenPayload,
  COGNITO_GROUPS,
} from '../aws/cognito/cognito.types';
import { AWSS3Service } from '../aws/s3/aws-s3.service';
import { S3Buckets } from '../aws/s3/types/s3Buckets';
import { MediaItemDto } from './dto/media-item.dto';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaQueryDto, MediaType } from './dto/media-query.dto';
import { MediaUploadResponseDto } from './dto/media-upload-response.dto';
import {
  IMAGE_EXTENSIONS,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  VIDEO_EXTENSIONS,
  VIDEO_MAX_BYTES,
  VIDEO_MIME_TYPES,
  UploadedMediaFile,
} from './media.constants';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3Region: string;
  private readonly s3Bucket: string;

  constructor(
    @InjectRepository(Site) private siteRepo: Repository<Site>,
    @InjectRepository(Image) private imageRepo: Repository<Image>,
    @InjectRepository(Video) private videoRepo: Repository<Video>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private s3: AWSS3Service,
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

  async uploadImage(
    file: UploadedMediaFile | undefined,
    siteId: string,
    caller: AccessTokenPayload | null,
  ): Promise<MediaUploadResponseDto> {
    return this.uploadMedia('image', file, siteId, caller);
  }

  async uploadVideo(
    file: UploadedMediaFile | undefined,
    siteId: string,
    caller: AccessTokenPayload | null,
  ): Promise<MediaUploadResponseDto> {
    return this.uploadMedia('video', file, siteId, caller);
  }

  private async uploadMedia(
    kind: 'image' | 'video',
    file: UploadedMediaFile | undefined,
    siteId: string,
    caller: AccessTokenPayload | null,
  ): Promise<MediaUploadResponseDto> {
    this.assertValidFile(kind, file);

    const site = await this.siteRepo.findOne({
      where: { id: siteId },
      relations: ['steward'],
    });
    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }
    this.assertCanUploadToSite(caller, site);

    const uploaded = await this.s3.putObject({
      fileBuffer: file.buffer,
      fileName: this.sanitizeFileName(file.originalname),
      mimeType: file.mimetype,
      bucket: S3Buckets.MEDIA,
    });

    const uploadedBy = await this.resolveUploader(caller);
    const repo = kind === 'image' ? this.imageRepo : this.videoRepo;

    try {
      const saved = await repo.save(
        repo.create({
          site,
          s3Key: uploaded.key,
          title: null,
          description: null,
          uploadedBy,
        }),
      );
      return { id: saved.id, siteId: site.id, url: uploaded.url };
    } catch (error) {
      await this.s3.deleteObject(uploaded.key, S3Buckets.MEDIA);
      this.logger.error(
        `Database insert failed after S3 upload; deleted object ${
          uploaded.key
        }: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  private assertValidFile(
    kind: 'image' | 'video',
    file: UploadedMediaFile | undefined,
  ): asserts file is UploadedMediaFile {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }

    const maxBytes = kind === 'image' ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
    if (file.size > maxBytes || file.buffer.length > maxBytes) {
      throw new PayloadTooLargeException(
        `File exceeds the maximum allowed size of ${
          maxBytes / (1024 * 1024)
        }MB`,
      );
    }

    const allowedMimes = kind === 'image' ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
    const allowedExts = kind === 'image' ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
    const ext = this.fileExtension(file.originalname);
    if (
      !(allowedMimes as readonly string[]).includes(file.mimetype) ||
      !allowedExts.includes(ext)
    ) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedExts
          .map((e) => e.replace('.', ''))
          .join(', ')}`,
      );
    }
  }

  /**
   * Admins may upload to any site. Stewards may only upload to a site whose
   * steward email matches their Cognito username. When auth is disabled there
   * is no caller, so no check runs.
   */
  private assertCanUploadToSite(
    caller: AccessTokenPayload | null,
    site: Site,
  ): void {
    if (!caller) {
      return;
    }
    const groups = caller['cognito:groups'] ?? [];
    if (groups.includes(COGNITO_GROUPS[UserType.ADMIN])) {
      return;
    }
    const email = caller.username?.trim().toLowerCase();
    if (!email || site.steward?.email?.toLowerCase() !== email) {
      throw new ForbiddenException(
        'Stewards can only upload media to their own site',
      );
    }
  }

  private async resolveUploader(
    caller: AccessTokenPayload | null,
  ): Promise<User | null> {
    const email = caller?.username?.trim();
    if (!email) {
      return null;
    }
    return this.userRepo.findOne({ where: { email: ILike(email) } });
  }

  private sanitizeFileName(name: string): string {
    const base = name.replace(/\\/g, '/').split('/').pop() ?? 'upload';
    // eslint-disable-next-line no-control-regex
    const cleaned = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
    if (!cleaned || cleaned.includes('..')) {
      return 'upload';
    }
    return cleaned;
  }

  private fileExtension(name: string): string {
    const dot = name.lastIndexOf('.');
    if (dot < 0) {
      return '';
    }
    return name.slice(dot).toLowerCase();
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
