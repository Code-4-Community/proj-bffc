import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { PlantResponseDto } from './dto/plant-response.dto';
import { SiteType } from '../entities/site.entity';
import { CognitoService } from '../aws/cognito/cognito.service';
import { CognitoJWTGuard } from '../aws/cognito/cognito.guard';
import { RolesGuard } from '../aws/cognito/roles.guard';

// jwks-rsa pulls in an ESM-only dependency; the 401 test never fetches keys.
jest.mock('jwks-rsa', () => jest.fn(() => ({ getSigningKey: jest.fn() })));

describe('PlantsController', () => {
  let controller: PlantsController;
  let mockService: { findOne: jest.Mock; create: jest.Mock };
  let mockCognito: { getUser: jest.Mock };

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
    mockService = { findOne: jest.fn(), create: jest.fn() };
    mockCognito = { getUser: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantsController],
      providers: [
        { provide: PlantsService, useValue: mockService },
        { provide: CognitoService, useValue: mockCognito },
      ],
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

  describe('createPlant', () => {
    const body = { name: 'Paw Paw', siteIds: ['site-1'] };
    const req = {} as Request;
    const caller = { sub: 'sub-1', 'cognito:groups': ['stewards'] };

    it('passes the body and the verified caller to the service', async () => {
      mockCognito.getUser.mockReturnValue(caller);
      mockService.create.mockResolvedValue(mockPlantResponse);

      const result = await controller.createPlant(body, req);

      expect(result).toEqual(mockPlantResponse);
      expect(mockCognito.getUser).toHaveBeenCalledWith(req);
      expect(mockService.create).toHaveBeenCalledWith(body, caller);
    });
  });

  // Runs the real guards against POST /plant's own metadata.
  describe('POST /plant auth', () => {
    const originalEnv = { ...process.env };

    const contextFor = (request: Partial<Request>): ExecutionContext =>
      ({
        getHandler: () => PlantsController.prototype.createPlant,
        getClass: () => PlantsController,
        switchToHttp: () => ({ getRequest: () => request }),
      } as unknown as ExecutionContext);

    beforeEach(() => {
      delete process.env.AUTH_DISABLED;
      process.env.COGNITO_USER_POOL_ID = 'us-east-2_test';
      process.env.COGNITO_CLIENT_ID = 'test-client';
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns 401 for a request without a bearer token', async () => {
      const guard = new CognitoJWTGuard(new Reflector());

      await expect(
        guard.canActivate(contextFor({ headers: {} })),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns 403 for a user who is not a steward or admin', () => {
      const guard = new RolesGuard(new Reflector());
      const request = { user: { 'cognito:groups': ['volunteers'] } };

      expect(() => guard.canActivate(contextFor(request as never))).toThrow(
        ForbiddenException,
      );
    });

    it.each([['stewards'], ['admins']])('allows a user in %s', (group) => {
      const guard = new RolesGuard(new Reflector());
      const request = { user: { 'cognito:groups': [group] } };

      expect(guard.canActivate(contextFor(request as never))).toBe(true);
    });
  });
});
