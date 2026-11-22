import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { PlantsService } from './plants.service';
import { Plant } from '../entities/plant.entity';
import { Site, SiteType } from '../entities/site.entity';
import { User } from '../entities/user.entity';
import { AccessTokenPayload } from '../aws/cognito/cognito.types';

describe('PlantsService', () => {
  let service: PlantsService;
  let mockRepo: { findOne: jest.Mock };
  let mockManager: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };

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
    mockManager = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((_entity, data) => ({ ...data })),
      save: jest.fn(async (plant) => ({ id: plantId, ...plant })),
    };
    mockDataSource = {
      transaction: jest.fn((work) => work(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantsService,
        { provide: getRepositoryToken(Plant), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
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

  describe('create', () => {
    const siteA = '11111111-1111-4111-8111-111111111111';
    const siteB = '22222222-2222-4222-8222-222222222222';

    const makeSite = (id: string, name: string, stewardEmail: string): Site =>
      ({
        id,
        name,
        type: SiteType.EXISTING_COALITION,
        steward: { email: stewardEmail } as User,
      } as Site);

    const token = (
      groups: string[],
      username?: string,
    ): AccessTokenPayload => ({
      sub: 'sub-1',
      username,
      'cognito:groups': groups,
      iss: 'issuer',
      token_use: 'access',
      client_id: 'client',
      exp: 0,
      iat: 0,
    });
    const admin = token(['admins'], 'admin@bffc.org');
    const steward = token(['stewards'], 'Steward@Example.com');

    it('creates a plant linked to multiple sites inside a transaction', async () => {
      mockManager.find.mockResolvedValue([
        makeSite(siteA, 'Egleston Orchard', 'steward@example.com'),
        makeSite(siteB, 'Roxbury Commons', 'steward@example.com'),
      ]);

      const result = await service.create(
        {
          name: 'Paw Paw',
          imageS3Key: 'plants/paw-paw.jpg',
          description: 'A native fruit tree',
          flavor: 'Custardy',
          harvestSeason: 'Late summer',
          howToHarvest: 'Pick when soft',
          recipes: ['https://example.com/pudding', 'Paw paw smoothie'],
          siteIds: [siteA, siteB],
        },
        steward,
      );

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.find).toHaveBeenCalledWith(Site, {
        where: { id: In([siteA, siteB]) },
        relations: ['steward'],
      });
      expect(mockManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          plantName: 'Paw Paw',
          hostSites: [
            expect.objectContaining({ id: siteA }),
            expect.objectContaining({ id: siteB }),
          ],
        }),
      );
      expect(result).toEqual({
        id: plantId,
        name: 'Paw Paw',
        imageUrl:
          'https://test-bucket.s3.us-east-2.amazonaws.com/plants/paw-paw.jpg',
        description: 'A native fruit tree',
        flavor: 'Custardy',
        harvestSeason: 'Late summer',
        howToHarvest: 'Pick when soft',
        recipes: ['https://example.com/pudding', 'Paw paw smoothie'],
        hostSites: [
          {
            id: siteA,
            name: 'Egleston Orchard',
            siteType: SiteType.EXISTING_COALITION,
          },
          {
            id: siteB,
            name: 'Roxbury Commons',
            siteType: SiteType.EXISTING_COALITION,
          },
        ],
      });
    });

    it('creates a plant with no sites and returns hostSites: []', async () => {
      const result = await service.create({ name: 'Mint' }, steward);

      expect(mockManager.find).not.toHaveBeenCalled();
      expect(result.hostSites).toEqual([]);
      expect(result.recipes).toEqual([]);
    });

    it('returns null (not missing) for empty optional text fields', async () => {
      const result = await service.create(
        {
          name: '  Mint  ',
          imageS3Key: '',
          description: '',
          flavor: '   ',
          harvestSeason: '',
        },
        admin,
      );

      expect(result).toEqual({
        id: plantId,
        name: 'Mint',
        imageUrl: null,
        description: null,
        flavor: null,
        harvestSeason: null,
        howToHarvest: null,
        recipes: [],
        hostSites: [],
      });
    });

    it('throws NotFoundException naming a site ID that does not exist', async () => {
      mockManager.find.mockResolvedValue([
        makeSite(siteA, 'Egleston Orchard', 'steward@example.com'),
      ]);

      await expect(
        service.create({ name: 'Paw Paw', siteIds: [siteA, siteB] }, admin),
      ).rejects.toThrow(new NotFoundException(`Site(s) not found: ${siteB}`));
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException when a steward links another steward's site", async () => {
      mockManager.find.mockResolvedValue([
        makeSite(siteA, 'Mine', 'steward@example.com'),
        makeSite(siteB, 'Not mine', 'someone-else@example.com'),
      ]);

      await expect(
        service.create({ name: 'Paw Paw', siteIds: [siteA, siteB] }, steward),
      ).rejects.toThrow(
        new ForbiddenException(
          `Stewards can only link plants to their own sites. Not your site(s): ${siteB}`,
        ),
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('lets an admin link any site', async () => {
      mockManager.find.mockResolvedValue([
        makeSite(siteA, 'Egleston', 'someone-else@example.com'),
      ]);

      const result = await service.create(
        { name: 'Paw Paw', siteIds: [siteA] },
        admin,
      );

      expect(result.hostSites).toEqual([
        { id: siteA, name: 'Egleston', siteType: SiteType.EXISTING_COALITION },
      ]);
    });

    it('skips the ownership check when auth is disabled (no caller)', async () => {
      mockManager.find.mockResolvedValue([
        makeSite(siteA, 'Egleston', 'someone-else@example.com'),
      ]);

      await expect(
        service.create({ name: 'Paw Paw', siteIds: [siteA] }, null),
      ).resolves.toMatchObject({ name: 'Paw Paw' });
    });
  });
});
