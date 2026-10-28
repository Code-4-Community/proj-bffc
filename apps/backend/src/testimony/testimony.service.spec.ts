import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TestimonyService } from './testimony.service';
import { Testimonial } from '../entities/testimonial.entity';
import { Site, SiteType } from '../entities/site.entity';
import { UserType } from '../entities/user.entity';

describe('TestimonyService', () => {
  let service: TestimonyService;
  let mockTestimonialRepo: { find: jest.Mock };
  let mockSiteRepo: { findOne: jest.Mock };

  const siteId = '123e4567-e89b-12d3-a456-426614174000';

  const mockSite: Partial<Site> = {
    id: siteId,
    name: 'Test Food Forest',
    type: SiteType.EXISTING_COALITION,
  };

  const mockTestimonials: Partial<Testimonial>[] = [
    {
      id: 'testimony-1',
      question: 'What do you love about this site?',
      answer: 'This food forest changed my life!',
      steward: {
        id: 'steward-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        type: UserType.STEWARD,
        sites: [],
        stewardEvents: [],
        announcements: [],
      },
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'testimony-2',
      question: 'How has this site impacted your community?',
      answer: 'A wonderful community resource.',
      steward: undefined,
      createdAt: new Date('2024-02-20'),
    },
  ];

  beforeEach(async () => {
    mockTestimonialRepo = { find: jest.fn() };
    mockSiteRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestimonyService,
        {
          provide: getRepositoryToken(Testimonial),
          useValue: mockTestimonialRepo,
        },
        { provide: getRepositoryToken(Site), useValue: mockSiteRepo },
      ],
    }).compile();

    service = module.get<TestimonyService>(TestimonyService);
  });

  describe('findBySiteId', () => {
    it('should return mapped testimony DTOs for valid site', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue(mockTestimonials);

      const result = await service.findBySiteId(siteId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('testimony-1');
      expect(result[0].quote).toBe('This food forest changed my life!');
      expect(result[0].steward).toEqual({ id: 'steward-1', name: 'Jane Doe' });
      expect(result[0].dateAdded).toEqual(new Date('2024-01-15'));
    });

    it('should map answer field to quote in response', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue(mockTestimonials);

      const result = await service.findBySiteId(siteId);

      expect(result[0].quote).toBe(mockTestimonials[0].answer);
    });

    it('should return null steward when not attributed', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue(mockTestimonials);

      const result = await service.findBySiteId(siteId);

      expect(result[1].steward).toBeNull();
    });

    it('should return only id and name for steward (not email)', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue(mockTestimonials);

      const result = await service.findBySiteId(siteId);

      expect(result[0].steward).toEqual({ id: 'steward-1', name: 'Jane Doe' });
      expect('email' in (result[0].steward as object)).toBe(false);
    });

    it('should throw NotFoundException for non-existent site', async () => {
      mockSiteRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySiteId('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySiteId('nonexistent-id')).rejects.toThrow(
        'Site with ID nonexistent-id not found',
      );
    });

    it('should return empty array for site with no testimonies', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue([]);

      const result = await service.findBySiteId(siteId);

      expect(result).toEqual([]);
    });

    it('should query testimonials with correct site filter and relations', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue([]);

      await service.findBySiteId(siteId);

      expect(mockTestimonialRepo.find).toHaveBeenCalledWith({
        where: { site: { id: siteId } },
        relations: ['steward'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should check site existence before querying testimonials', async () => {
      mockSiteRepo.findOne.mockResolvedValue(null);

      await expect(service.findBySiteId(siteId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockSiteRepo.findOne).toHaveBeenCalledWith({
        where: { id: siteId },
      });
      expect(mockTestimonialRepo.find).not.toHaveBeenCalled();
    });

    it('should order testimonies by createdAt descending', async () => {
      mockSiteRepo.findOne.mockResolvedValue(mockSite);
      mockTestimonialRepo.find.mockResolvedValue(mockTestimonials);

      await service.findBySiteId(siteId);

      expect(mockTestimonialRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });
});
