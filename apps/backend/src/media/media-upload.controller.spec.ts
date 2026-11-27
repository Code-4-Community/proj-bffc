import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ImageController } from './image.controller';
import { VideoController } from './video.controller';
import { MediaService } from './media.service';
import { CognitoService } from '../aws/cognito/cognito.service';
import { CognitoJWTGuard } from '../aws/cognito/cognito.guard';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { UploadedMediaFile } from './media.constants';

jest.mock('jwks-rsa', () => jest.fn(() => ({ getSigningKey: jest.fn() })));

describe('POST /image and POST /video', () => {
  let imageController: ImageController;
  let videoController: VideoController;
  let mockService: { uploadImage: jest.Mock; uploadVideo: jest.Mock };
  let mockCognito: { getUser: jest.Mock };

  const siteId = '11111111-1111-4111-8111-111111111111';
  const file: UploadedMediaFile = {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 12,
    buffer: Buffer.from('fake'),
  };
  const created = {
    id: '33333333-3333-4333-8333-333333333333',
    siteId,
    url: 'https://bucket.s3.us-east-2.amazonaws.com/photo.jpg',
  };

  beforeEach(async () => {
    mockService = {
      uploadImage: jest.fn().mockResolvedValue(created),
      uploadVideo: jest.fn().mockResolvedValue(created),
    };
    mockCognito = { getUser: jest.fn().mockReturnValue({ sub: 'sub-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageController, VideoController],
      providers: [
        { provide: MediaService, useValue: mockService },
        { provide: CognitoService, useValue: mockCognito },
      ],
    }).compile();

    imageController = module.get(ImageController);
    videoController = module.get(VideoController);
  });

  it('passes a valid image upload through to the service', async () => {
    const req = {} as Request;
    const result = await imageController.uploadImage(file, { siteId }, req);

    expect(result).toEqual(created);
    expect(mockCognito.getUser).toHaveBeenCalledWith(req);
    expect(mockService.uploadImage).toHaveBeenCalledWith(file, siteId, {
      sub: 'sub-1',
    });
  });

  it('passes a valid video upload through to the service', async () => {
    const req = {} as Request;
    await videoController.uploadVideo(file, { siteId }, req);

    expect(mockService.uploadVideo).toHaveBeenCalledWith(file, siteId, {
      sub: 'sub-1',
    });
  });

  describe('auth', () => {
    const originalEnv = { ...process.env };

    const contextFor = (
      handler: (...args: never[]) => unknown,
      cls: object,
      request: Partial<Request>,
    ): ExecutionContext =>
      ({
        getHandler: () => handler,
        getClass: () => cls,
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

    it('returns 401 for an unauthenticated image upload', async () => {
      const guard = new CognitoJWTGuard(new Reflector());

      await expect(
        guard.canActivate(
          contextFor(ImageController.prototype.uploadImage, ImageController, {
            headers: {},
          }),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns 403 for a wrong-role image upload', () => {
      const guard = new RolesGuard(new Reflector());
      const request = { user: { 'cognito:groups': ['volunteers'] } };

      expect(() =>
        guard.canActivate(
          contextFor(
            ImageController.prototype.uploadImage,
            ImageController,
            request as never,
          ),
        ),
      ).toThrow(ForbiddenException);
    });

    it('returns 401 for an unauthenticated video upload', async () => {
      const guard = new CognitoJWTGuard(new Reflector());

      await expect(
        guard.canActivate(
          contextFor(VideoController.prototype.uploadVideo, VideoController, {
            headers: {},
          }),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it.each([['stewards'], ['admins']])(
      'allows a user in %s to upload',
      (group) => {
        const guard = new RolesGuard(new Reflector());
        const request = { user: { 'cognito:groups': [group] } };

        expect(
          guard.canActivate(
            contextFor(
              ImageController.prototype.uploadImage,
              ImageController,
              request as never,
            ),
          ),
        ).toBe(true);
      },
    );
  });
});
