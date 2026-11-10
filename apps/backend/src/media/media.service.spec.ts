import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { Site } from '../entities/site.entity';
import { Image } from '../entities/image.entity';
import { Video } from '../entities/video.entity';
import { MediaType } from './dto/media-query.dto';

describe('MediaService', () => {
  let service: MediaService;
  let siteRepo: { exists: jest.Mock };
  let imageRepo: { findAndCount: jest.Mock; count: jest.Mock };
  let videoRepo: { findAndCount: jest.Mock; count: jest.Mock };

  const siteId = '123e4567-e89b-12d3-a456-426614174000';

  const alex = { id: 'u-admin', name: 'Alex Rivera' } as Image['uploadedBy'];
  const jamie = { id: 'u-steward', name: 'Jamie Chen' } as Image['uploadedBy'];

  // Three images with out-of-order uploadedAt values so sorting is observable,
  // plus a single video. uploadedBy is tracked per item.
  const makeSite = (overrides: Partial<Site> = {}): Partial<Site> => ({
    id: siteId,
    name: 'Egleston Community Orchard',
    images: [
      {
        id: 'img-old',
        s3Key: 'sites/test/old.jpg',
        title: 'Old',
        description: 'oldest image',
        uploadedAt: new Date('2026-01-01T00:00:00Z'),
        uploadedBy: alex,
        site: {} as Site,
      },
      {
        id: 'img-new',
        s3Key: 'sites/test/new.jpg',
        title: 'New',
        description: 'newest image',
        uploadedAt: new Date('2026-06-01T00:00:00Z'),
        uploadedBy: jamie,
        site: {} as Site,
      },
      {
        id: 'img-mid',
        s3Key: 'sites/test/mid.jpg',
        title: 'Mid',
        description: 'middle image',
        uploadedAt: new Date('2026-03-01T00:00:00Z'),
        uploadedBy: alex,
        site: {} as Site,
      },
    ],
    videos: [
      {
        id: 'vid-1',
        s3Key: 'sites/test/tour.mp4',
        title: 'Tour',
        description: 'walking tour',
        uploadedAt: new Date('2026-05-01T00:00:00Z'),
        uploadedBy: jamie,
        site: {} as Site,
      },
    ],
    ...overrides,
  });

  const defaultQuery = { page: 1, limit: 20 };

  const images = () =>
    makeSite()
      .images!.slice()
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  const videos = () => makeSite().videos!;

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-bucket';

    siteRepo = { exists: jest.fn().mockResolvedValue(true) };
    imageRepo = {
      findAndCount: jest.fn().mockResolvedValue([images(), 3]),
      count: jest.fn().mockResolvedValue(3),
    };
    videoRepo = {
      findAndCount: jest.fn().mockResolvedValue([videos(), 1]),
      count: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Site), useValue: siteRepo },
        { provide: getRepositoryToken(Image), useValue: imageRepo },
        { provide: getRepositoryToken(Video), useValue: videoRepo },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('paginates in the database, newest first, with uploaders loaded', async () => {
    await service.getMediaBySiteId(siteId, { page: 3, limit: 5 });

    const expected = {
      where: { site: { id: siteId } },
      relations: ['uploadedBy'],
      order: { uploadedAt: 'DESC', id: 'ASC' },
      skip: 10,
      take: 5,
    };
    expect(imageRepo.findAndCount).toHaveBeenCalledWith(expected);
    expect(videoRepo.findAndCount).toHaveBeenCalledWith(expected);
  });

  it('returns both images and videos with URLs, metadata, and uploadedBy', async () => {
    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images.map((i) => i.id)).toEqual([
      'img-new',
      'img-mid',
      'img-old',
    ]);
    expect(result.videos[0]).toEqual({
      id: 'vid-1',
      url: 'https://test-bucket.s3.us-east-2.amazonaws.com/sites/test/tour.mp4',
      title: 'Tour',
      description: 'walking tour',
      uploadedAt: new Date('2026-05-01T00:00:00Z'),
      uploadedBy: 'Jamie Chen',
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      imagesTotal: 3,
      videosTotal: 1,
    });
  });

  it('returns only images when type=image, without fetching video rows', async () => {
    const result = await service.getMediaBySiteId(siteId, {
      ...defaultQuery,
      type: MediaType.IMAGE,
    });

    expect(result.images).toHaveLength(3);
    expect(result.videos).toEqual([]);
    expect(videoRepo.findAndCount).not.toHaveBeenCalled();
    // Totals still reflect everything available.
    expect(result.pagination.videosTotal).toBe(1);
  });

  it('returns only videos when type=video, without fetching image rows', async () => {
    const result = await service.getMediaBySiteId(siteId, {
      ...defaultQuery,
      type: MediaType.VIDEO,
    });

    expect(result.videos).toHaveLength(1);
    expect(result.images).toEqual([]);
    expect(imageRepo.findAndCount).not.toHaveBeenCalled();
    expect(result.pagination.imagesTotal).toBe(3);
  });

  it('returns empty arrays for a site with no media', async () => {
    imageRepo.findAndCount.mockResolvedValue([[], 0]);
    videoRepo.findAndCount.mockResolvedValue([[], 0]);

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result).toEqual({
      images: [],
      videos: [],
      pagination: { page: 1, limit: 20, imagesTotal: 0, videosTotal: 0 },
    });
  });

  it('keeps full totals when the page holds only part of the results', async () => {
    imageRepo.findAndCount.mockResolvedValue([[images()[2]], 3]);

    const result = await service.getMediaBySiteId(siteId, {
      page: 2,
      limit: 2,
    });

    expect(result.images.map((i) => i.id)).toEqual(['img-old']);
    expect(result.pagination.imagesTotal).toBe(3);
  });

  it('returns null uploadedBy when a media item has no uploader', async () => {
    imageRepo.findAndCount.mockResolvedValue([
      [{ ...images()[0], uploadedBy: null }],
      1,
    ]);

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images[0].uploadedBy).toBeNull();
  });

  it('throws NotFoundException when the site does not exist', async () => {
    siteRepo.exists.mockResolvedValue(false);

    await expect(
      service.getMediaBySiteId(
        '00000000-0000-0000-0000-000000000000',
        defaultQuery,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(imageRepo.findAndCount).not.toHaveBeenCalled();
  });
});
