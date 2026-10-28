import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import { Site } from '../entities/site.entity';
import { Image } from '../entities/image.entity';
import { MediaType } from './dto/media-query.dto';

describe('MediaService', () => {
  let service: MediaService;
  let mockRepo: { findOne: jest.Mock };

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

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-bucket';

    mockRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Site), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('loads the images/videos relations with their uploaders', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    await service.getMediaBySiteId(siteId, defaultQuery);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { id: siteId },
      relations: ['images', 'images.uploadedBy', 'videos', 'videos.uploadedBy'],
    });
  });

  it('returns both images and videos with URLs, metadata, and uploadedBy', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images).toHaveLength(3);
    expect(result.videos).toHaveLength(1);
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

  it('sorts each array newest first', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images.map((i) => i.id)).toEqual([
      'img-new',
      'img-mid',
      'img-old',
    ]);
  });

  it('returns only images when type=image', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    const result = await service.getMediaBySiteId(siteId, {
      ...defaultQuery,
      type: MediaType.IMAGE,
    });

    expect(result.images).toHaveLength(3);
    expect(result.videos).toEqual([]);
    // Totals still reflect everything available.
    expect(result.pagination.videosTotal).toBe(1);
  });

  it('returns only videos when type=video', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    const result = await service.getMediaBySiteId(siteId, {
      ...defaultQuery,
      type: MediaType.VIDEO,
    });

    expect(result.videos).toHaveLength(1);
    expect(result.images).toEqual([]);
    expect(result.pagination.imagesTotal).toBe(3);
  });

  it('handles a site with only images', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite({ videos: [] }));

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images).toHaveLength(3);
    expect(result.videos).toEqual([]);
    expect(result.pagination.videosTotal).toBe(0);
  });

  it('handles a site with only videos', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite({ images: [] }));

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.videos).toHaveLength(1);
    expect(result.images).toEqual([]);
    expect(result.pagination.imagesTotal).toBe(0);
  });

  it('returns empty arrays for a site with no media', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite({ images: [], videos: [] }));

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result).toEqual({
      images: [],
      videos: [],
      pagination: { page: 1, limit: 20, imagesTotal: 0, videosTotal: 0 },
    });
  });

  it('paginates each array while keeping full totals', async () => {
    mockRepo.findOne.mockResolvedValue(makeSite());

    const page1 = await service.getMediaBySiteId(siteId, { page: 1, limit: 2 });
    expect(page1.images.map((i) => i.id)).toEqual(['img-new', 'img-mid']);
    expect(page1.pagination.imagesTotal).toBe(3);

    const page2 = await service.getMediaBySiteId(siteId, { page: 2, limit: 2 });
    expect(page2.images.map((i) => i.id)).toEqual(['img-old']);
    expect(page2.pagination.imagesTotal).toBe(3);
  });

  it('returns null uploadedBy when a media item has no uploader', async () => {
    mockRepo.findOne.mockResolvedValue(
      makeSite({
        images: [
          {
            id: 'img-nouploader',
            s3Key: 'sites/test/x.jpg',
            title: null,
            description: null,
            uploadedAt: new Date('2026-01-01T00:00:00Z'),
            uploadedBy: null,
            site: {} as Site,
          },
        ],
      }),
    );

    const result = await service.getMediaBySiteId(siteId, defaultQuery);

    expect(result.images[0].uploadedBy).toBeNull();
  });

  it('throws NotFoundException when the site does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getMediaBySiteId(
        '00000000-0000-0000-0000-000000000000',
        defaultQuery,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('falls back to the raw s3Key when no bucket is configured', async () => {
    process.env.AWS_MEDIA_BUCKET_NAME = '';

    const moduleNoBucket: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Site), useValue: mockRepo },
      ],
    }).compile();
    const serviceNoBucket = moduleNoBucket.get<MediaService>(MediaService);

    mockRepo.findOne.mockResolvedValue(makeSite());

    const result = await serviceNoBucket.getMediaBySiteId(siteId, defaultQuery);

    expect(result.videos[0].url).toBe('sites/test/tour.mp4');
  });
});
