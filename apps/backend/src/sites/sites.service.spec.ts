import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SitesService } from './sites.service';
import { Site, SiteType } from '../entities/site.entity';
import { UserType } from '../entities/user.entity';

describe('SitesService', () => {
  let service: SitesService;
  let mockRepo: { findOne: jest.Mock };

  const mockSite: Partial<Site> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Egleston Community Orchard',
    type: SiteType.EXISTING_COALITION,
    history: 'Founded in 2012...',
    accessibility: 'Wheelchair accessible',
    steward: {
      id: 'steward-uuid',
      name: 'Jamie Chen',
      email: 'jamie@example.com',
      type: UserType.STEWARD,
      sites: [],
      stewardEvents: [],
      announcements: [],
    },
    address: {
      id: 'addr-uuid',
      street: '196 Washington St',
      city: 'Boston',
      state: 'MA',
      zip: '02130',
      location: { type: 'Point', coordinates: [-71.1097, 42.3092] },
      site: {} as Site,
      geojson: {},
    },
    images: [{ id: 'img-1', s3Key: 'sites/test/img.jpg', site: {} as Site }],
    videos: [],
    plantInventory: [{ id: 'plant-1', plantName: 'Paw Paw', site: {} as Site }],
    partnerOrgs: [
      { id: 'org-1', name: 'Boston Food Forest Coalition', site: {} as Site },
    ],
  };

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-bucket';

    mockRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: getRepositoryToken(Site), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
  });

  describe('findOne', () => {
    it('should return mapped site DTO for valid ID', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.id).toBe(mockSite.id);
      expect(result.name).toBe(mockSite.name);
      expect(result.type).toBe(mockSite.type);
      expect(result.history).toBe(mockSite.history);
      expect(result.accessibility).toBe(mockSite.accessibility);
    });

    it('should return steward with only id and name', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.steward).toEqual({
        id: 'steward-uuid',
        name: 'Jamie Chen',
      });
      expect('email' in (result.steward as object)).toBe(false);
    });

    it('should throw NotFoundException for non-existent site', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should correctly load required relations', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      await service.findOne(mockSite.id!);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockSite.id },
        relations: [
          'steward',
          'address',
          'images',
          'videos',
          'plantInventory',
          'partnerOrgs',
        ],
      });
    });

    it('should NOT load excluded relations (events, announcements, testimonials)', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      await service.findOne(mockSite.id!);

      const callArgs = mockRepo.findOne.mock.calls[0][0];
      expect(callArgs.relations).not.toContain('adminEvents');
      expect(callArgs.relations).not.toContain('stewardEvents');
      expect(callArgs.relations).not.toContain('testimonials');
      expect(callArgs.relations).not.toContain('announcements');
    });

    it('should build correct S3 URLs for images', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.images[0].url).toBe(
        'https://test-bucket.s3.us-east-2.amazonaws.com/sites/test/img.jpg',
      );
    });

    it('should handle site with no images/videos gracefully', async () => {
      const siteNoMedia = { ...mockSite, images: [], videos: [] };
      mockRepo.findOne.mockResolvedValue(siteNoMedia);

      const result = await service.findOne(mockSite.id!);

      expect(result.images).toEqual([]);
      expect(result.videos).toEqual([]);
    });

    it('should handle null address gracefully', async () => {
      const siteNoAddress = { ...mockSite, address: null };
      mockRepo.findOne.mockResolvedValue(siteNoAddress);

      const result = await service.findOne(mockSite.id!);

      expect(result.address).toBeNull();
    });

    it('should handle null steward gracefully', async () => {
      const siteNoSteward = { ...mockSite, steward: null };
      mockRepo.findOne.mockResolvedValue(siteNoSteward);

      const result = await service.findOne(mockSite.id!);

      expect(result.steward).toBeNull();
    });

    it('should map address with location correctly', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.address).toEqual({
        id: 'addr-uuid',
        street: '196 Washington St',
        city: 'Boston',
        state: 'MA',
        zip: '02130',
        location: {
          type: 'Point',
          coordinates: [-71.1097, 42.3092],
        },
      });
    });

    it('should map plant inventory correctly', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.plantInventory).toEqual([
        { id: 'plant-1', plantName: 'Paw Paw' },
      ]);
    });

    it('should map partner orgs correctly', async () => {
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await service.findOne(mockSite.id!);

      expect(result.partnerOrgs).toEqual([
        { id: 'org-1', name: 'Boston Food Forest Coalition' },
      ]);
    });

    it('should fallback to s3Key when bucket is not configured', async () => {
      process.env.AWS_MEDIA_BUCKET_NAME = '';

      const moduleWithNoBucket: TestingModule = await Test.createTestingModule({
        providers: [
          SitesService,
          { provide: getRepositoryToken(Site), useValue: mockRepo },
        ],
      }).compile();

      const serviceNoBucket =
        moduleWithNoBucket.get<SitesService>(SitesService);
      mockRepo.findOne.mockResolvedValue(mockSite);

      const result = await serviceNoBucket.findOne(mockSite.id!);

      expect(result.images[0].url).toBe('sites/test/img.jpg');
    });
  });
});
