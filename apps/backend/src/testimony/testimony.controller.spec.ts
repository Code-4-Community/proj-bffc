import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TestimonyController } from './testimony.controller';
import { TestimonyService } from './testimony.service';
import { TestimonyResponseDto } from './dto/testimony-response.dto';

describe('TestimonyController', () => {
  let controller: TestimonyController;
  let mockService: { findBySiteId: jest.Mock };

  const mockTestimonies: TestimonyResponseDto[] = [
    {
      id: 'testimony-1',
      quote: 'This food forest changed my life!',
      steward: { id: 'steward-1', name: 'Jane Doe' },
      dateAdded: new Date('2024-01-15'),
    },
    {
      id: 'testimony-2',
      quote: 'A wonderful community resource.',
      steward: null,
      dateAdded: new Date('2024-02-20'),
    },
  ];

  beforeEach(async () => {
    mockService = { findBySiteId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestimonyController],
      providers: [{ provide: TestimonyService, useValue: mockService }],
    }).compile();

    controller = module.get<TestimonyController>(TestimonyController);
  });

  describe('getTestimonies', () => {
    it('should return testimonies for valid site ID', async () => {
      mockService.findBySiteId.mockResolvedValue(mockTestimonies);

      const siteId = '123e4567-e89b-12d3-a456-426614174000';
      const result = await controller.getTestimonies(siteId);

      expect(mockService.findBySiteId).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockTestimonies);
    });

    it('should return empty array for site with no testimonies', async () => {
      mockService.findBySiteId.mockResolvedValue([]);

      const siteId = '123e4567-e89b-12d3-a456-426614174000';
      const result = await controller.getTestimonies(siteId);

      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findBySiteId.mockRejectedValue(
        new NotFoundException('Site not found'),
      );

      await expect(
        controller.getTestimonies('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call service with correct site ID', async () => {
      const testSiteId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      mockService.findBySiteId.mockResolvedValue([]);

      await controller.getTestimonies(testSiteId);

      expect(mockService.findBySiteId).toHaveBeenCalledWith(testSiteId);
    });
  });
});
