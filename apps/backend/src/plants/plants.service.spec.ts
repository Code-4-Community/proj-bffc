import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { Plant } from '../entities/plant.entity';
import { Site, SiteType } from '../entities/site.entity';

describe('PlantsService', () => {
  let service: PlantsService;
  let mockRepo: { findOne: jest.Mock };

  const plantId = '123e4567-e89b-12d3-a456-426614174000';

  const makePlant = (overrides: Partial<Plant> = {}): Plant =>
    ({
      id: plantId,
      plantName: 'Paw Paw',
      imageS3Key: 'plants/paw-paw.jpg',
      description: 'A native North American fruit tree',
      flavor: 'Tropical, custardy',
      harvestSeason: 'Late summer',
      howToHarvest: 'Pick when soft and fragrant',
      recipes: ['https://example.com/paw-paw-pudding', 'Paw paw smoothie'],
      hostSites: [],
      ...overrides,
    } as Plant);

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-bucket';

    mockRepo = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantsService,
        { provide: getRepositoryToken(Plant), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PlantsService>(PlantsService);
  });

  describe('findOne', () => {
    it('returns the plant with multiple host sites of all types', async () => {
      mockRepo.findOne.mockResolvedValue(
        makePlant({
          hostSites: [
            {
              id: 'site-1',
              name: 'Egleston Orchard',
              type: SiteType.EXISTING_COALITION,
            },
            {
              id: 'site-2',
              name: 'Roxbury Commons',
              type: SiteType.EMERGING_LAND_TRUST,
            },
            {
              id: 'site-3',
              name: 'Dorchester Grove',
              type: SiteType.EXISTING_LAND_TRUST,
            },
          ] as Site[],
        }),
      );

      const result = await service.findOne(plantId);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: plantId },
        relations: ['hostSites'],
      });
      expect(result).toEqual({
        id: plantId,
        name: 'Paw Paw',
        imageUrl:
          'https://test-bucket.s3.us-east-2.amazonaws.com/plants/paw-paw.jpg',
        description: 'A native North American fruit tree',
        flavor: 'Tropical, custardy',
        harvestSeason: 'Late summer',
        howToHarvest: 'Pick when soft and fragrant',
        recipes: ['https://example.com/paw-paw-pudding', 'Paw paw smoothie'],
        hostSites: [
          {
            id: 'site-1',
            name: 'Egleston Orchard',
            siteType: SiteType.EXISTING_COALITION,
          },
          {
            id: 'site-2',
            name: 'Roxbury Commons',
            siteType: SiteType.EMERGING_LAND_TRUST,
          },
          {
            id: 'site-3',
            name: 'Dorchester Grove',
            siteType: SiteType.EXISTING_LAND_TRUST,
          },
        ],
      });
    });

    it('returns an empty hostSites array for a plant with no host sites', async () => {
      mockRepo.findOne.mockResolvedValue(makePlant({ hostSites: [] }));

      const result = await service.findOne(plantId);

      expect(result.hostSites).toEqual([]);
    });

    it('returns an empty hostSites array when the relation is undefined', async () => {
      mockRepo.findOne.mockResolvedValue(
        makePlant({ hostSites: undefined as unknown as Site[] }),
      );

      const result = await service.findOne(plantId);

      expect(result.hostSites).toEqual([]);
    });

    it('returns null for empty optional fields and [] for empty recipes', async () => {
      mockRepo.findOne.mockResolvedValue(
        makePlant({
          imageS3Key: undefined,
          description: undefined,
          flavor: undefined,
          harvestSeason: undefined,
          howToHarvest: undefined,
          recipes: [],
        }),
      );

      const result = await service.findOne(plantId);

      expect(result).toMatchObject({
        imageUrl: null,
        description: null,
        flavor: null,
        harvestSeason: null,
        howToHarvest: null,
        recipes: [],
      });
      // keys must be present (null), not missing
      expect(Object.keys(result)).toEqual(
        expect.arrayContaining([
          'imageUrl',
          'description',
          'flavor',
          'harvestSeason',
          'howToHarvest',
        ]),
      );
    });

    it('treats database nulls like missing values', async () => {
      mockRepo.findOne.mockResolvedValue(
        makePlant({
          imageS3Key: null as unknown as undefined,
          description: null as unknown as undefined,
        }),
      );

      const result = await service.findOne(plantId);

      expect(result.imageUrl).toBeNull();
      expect(result.description).toBeNull();
    });

    it('throws NotFoundException when the plant does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(plantId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(plantId)).rejects.toThrow(
        `Plant with ID ${plantId} not found`,
      );
    });
  });
});
