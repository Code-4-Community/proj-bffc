import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { PlantResponseDto } from './dto/plant-response.dto';
import { SiteType } from '../entities/site.entity';

describe('PlantsController', () => {
  let controller: PlantsController;
  let mockService: { findOne: jest.Mock };

  const plantId = '123e4567-e89b-12d3-a456-426614174000';

  const mockPlantResponse: PlantResponseDto = {
    id: plantId,
    name: 'Paw Paw',
    imageUrl: 'https://bucket.s3.us-east-2.amazonaws.com/paw-paw.jpg',
    description: 'A native fruit tree',
    flavor: null,
    harvestSeason: 'Late summer',
    howToHarvest: null,
    recipes: ['https://example.com/recipe'],
    hostSites: [
      { id: 'site-1', name: 'Egleston', siteType: SiteType.EXISTING_COALITION },
    ],
  };

  beforeEach(async () => {
    mockService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantsController],
      providers: [{ provide: PlantsService, useValue: mockService }],
    }).compile();

    controller = module.get<PlantsController>(PlantsController);
  });

  describe('getPlant', () => {
    it('returns plant details for a valid ID', async () => {
      mockService.findOne.mockResolvedValue(mockPlantResponse);

      const result = await controller.getPlant(plantId);

      expect(result).toEqual(mockPlantResponse);
      expect(mockService.findOne).toHaveBeenCalledWith(plantId);
    });

    it('propagates NotFoundException for an unknown plant', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException(`Plant with ID ${plantId} not found`),
      );

      await expect(controller.getPlant(plantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('id validation (ParseUUIDPipe)', () => {
    const pipe = new ParseUUIDPipe();
    const meta = { type: 'param' as const, data: 'id' };

    it.each(['abc', '123', '', 'not-a-uuid-at-all'])(
      'rejects malformed id %p with 400',
      async (badId) => {
        await expect(pipe.transform(badId, meta)).rejects.toThrow(
          BadRequestException,
        );
      },
    );

    it('has a clear error message', async () => {
      await expect(pipe.transform('abc', meta)).rejects.toThrow(
        'Validation failed (uuid is expected)',
      );
    });

    it('accepts a valid UUID', async () => {
      await expect(pipe.transform(plantId, meta)).resolves.toBe(plantId);
    });
  });
});
