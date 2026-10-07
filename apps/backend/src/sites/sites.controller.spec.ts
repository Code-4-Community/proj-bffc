import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SitesController } from './sites.controller';
import { SitesService } from './sites.service';
import { SiteType } from '../entities/site.entity';
import { SiteResponseDto } from './dto/site-response.dto';

describe('SitesController', () => {
  let controller: SitesController;
  let mockService: { findOne: jest.Mock };

  const mockSiteResponse: SiteResponseDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Site',
    type: SiteType.EXISTING_COALITION,
    history: 'Test history',
    accessibility: 'Wheelchair accessible',
    address: {
      id: 'addr-id',
      street: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip: '02130',
      location: { type: 'Point', coordinates: [-71.1, 42.3] },
    },
    steward: { id: 'steward-id', name: 'Jane Doe' },
    images: [
      { id: 'img-1', url: 'https://bucket.s3.us-east-2.amazonaws.com/img.jpg' },
    ],
    videos: [],
    plantInventory: [{ id: 'plant-1', plantName: 'Oak' }],
    partnerOrgs: [],
    volunteerOpportunities: [],
  };

  beforeEach(async () => {
    mockService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitesController],
      providers: [{ provide: SitesService, useValue: mockService }],
    }).compile();

    controller = module.get<SitesController>(SitesController);
  });

  describe('getSite', () => {
    it('should return site details for valid ID', async () => {
      mockService.findOne.mockResolvedValue(mockSiteResponse);

      const result = await controller.getSite(mockSiteResponse.id);

      expect(mockService.findOne).toHaveBeenCalledWith(mockSiteResponse.id);
      expect(result).toEqual(mockSiteResponse);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('Site not found'),
      );

      await expect(
        controller.getSite('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call service with correct ID', async () => {
      const testId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      mockService.findOne.mockResolvedValue(mockSiteResponse);

      await controller.getSite(testId);

      expect(mockService.findOne).toHaveBeenCalledWith(testId);
    });
  });
});
