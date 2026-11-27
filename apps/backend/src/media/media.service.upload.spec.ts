import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { MediaService } from './media.service';
import { Site } from '../entities/site.entity';
import { Image } from '../entities/image.entity';
import { Video } from '../entities/video.entity';
import { User } from '../entities/user.entity';
import { AWSS3Service } from '../aws/s3/aws-s3.service';
import { S3Buckets } from '../aws/s3/types/s3Buckets';
import { AccessTokenPayload } from '../aws/cognito/cognito.types';
import { UploadedMediaFile } from './media.constants';

describe('MediaService uploads', () => {
  let service: MediaService;
  let siteRepo: { findOne: jest.Mock };
  let imageRepo: { create: jest.Mock; save: jest.Mock };
  let videoRepo: { create: jest.Mock; save: jest.Mock };
  let userRepo: { findOne: jest.Mock };
  let s3: { putObject: jest.Mock; deleteObject: jest.Mock };

  const siteId = '11111111-1111-4111-8111-111111111111';
  const otherSiteId = '22222222-2222-4222-8222-222222222222';
  const recordId = '33333333-3333-4333-8333-333333333333';
  const uploadedUrl =
    'https://test-bucket.s3.us-east-2.amazonaws.com/photo-1.jpg';

  const makeSite = (id: string, stewardEmail: string): Site =>
    ({
      id,
      name: 'Egleston',
      steward: { email: stewardEmail } as User,
    } as Site);

  const token = (groups: string[], username?: string): AccessTokenPayload => ({
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

  const imageFile = (
    overrides: Partial<UploadedMediaFile> = {},
  ): UploadedMediaFile => ({
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 12,
    buffer: Buffer.from('fake-image'),
    ...overrides,
  });

  const videoFile = (
    overrides: Partial<UploadedMediaFile> = {},
  ): UploadedMediaFile => ({
    originalname: 'tour.mp4',
    mimetype: 'video/mp4',
    size: 24,
    buffer: Buffer.from('fake-video'),
    ...overrides,
  });

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_MEDIA_BUCKET_NAME = 'test-bucket';

    siteRepo = { findOne: jest.fn() };
    imageRepo = {
      create: jest.fn((row) => row),
      save: jest.fn().mockResolvedValue({ id: recordId }),
    };
    videoRepo = {
      create: jest.fn((row) => row),
      save: jest.fn().mockResolvedValue({ id: recordId }),
    };
    userRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'u-1', name: 'Jamie' }),
    };
    s3 = {
      putObject: jest.fn().mockResolvedValue({
        key: 'photo-1.jpg',
        url: uploadedUrl,
      }),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Site), useValue: siteRepo },
        { provide: getRepositoryToken(Image), useValue: imageRepo },
        { provide: getRepositoryToken(Video), useValue: videoRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: AWSS3Service, useValue: s3 },
      ],
    }).compile();

    service = module.get(MediaService);
  });

  it('uploads a valid image, stores the S3 key, and returns id, siteId, and url', async () => {
    siteRepo.findOne.mockResolvedValue(makeSite(siteId, 'steward@example.com'));

    const result = await service.uploadImage(imageFile(), siteId, steward);

    expect(s3.putObject).toHaveBeenCalledWith({
      fileBuffer: expect.any(Buffer),
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      bucket: S3Buckets.MEDIA,
    });
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: ILike('Steward@Example.com') },
    });
    expect(imageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ s3Key: 'photo-1.jpg' }),
    );
    expect(result).toEqual({ id: recordId, siteId, url: uploadedUrl });
  });

  it('uploads a valid video including .mov', async () => {
    siteRepo.findOne.mockResolvedValue(makeSite(siteId, 'steward@example.com'));

    const result = await service.uploadVideo(
      videoFile({
        originalname: 'clip.mov',
        mimetype: 'video/quicktime',
      }),
      siteId,
      admin,
    );

    expect(s3.putObject).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'clip.mov',
        mimeType: 'video/quicktime',
      }),
    );
    expect(videoRepo.save).toHaveBeenCalled();
    expect(result.url).toBe(uploadedUrl);
  });

  it('rejects a disallowed file type with 400', async () => {
    await expect(
      service.uploadImage(
        imageFile({ originalname: 'notes.pdf', mimetype: 'application/pdf' }),
        siteId,
        admin,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('rejects an oversized image with 413', async () => {
    await expect(
      service.uploadImage(
        imageFile({ size: 10 * 1024 * 1024 + 1 }),
        siteId,
        admin,
      ),
    ).rejects.toThrow(PayloadTooLargeException);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the site does not exist', async () => {
    siteRepo.findOne.mockResolvedValue(null);

    await expect(
      service.uploadImage(imageFile(), siteId, admin),
    ).rejects.toThrow(NotFoundException);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it("throws ForbiddenException when a steward uploads to another steward's site", async () => {
    siteRepo.findOne.mockResolvedValue(
      makeSite(otherSiteId, 'someone-else@example.com'),
    );

    await expect(
      service.uploadImage(imageFile(), otherSiteId, steward),
    ).rejects.toThrow(ForbiddenException);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('lets an admin upload to any site', async () => {
    siteRepo.findOne.mockResolvedValue(
      makeSite(otherSiteId, 'someone-else@example.com'),
    );

    await expect(
      service.uploadImage(imageFile(), otherSiteId, admin),
    ).resolves.toMatchObject({ siteId: otherSiteId });
  });

  it('deletes the S3 object when the database insert fails', async () => {
    siteRepo.findOne.mockResolvedValue(makeSite(siteId, 'steward@example.com'));
    imageRepo.save.mockRejectedValue(new Error('insert failed'));

    await expect(
      service.uploadImage(imageFile(), siteId, steward),
    ).rejects.toThrow('insert failed');
    expect(s3.deleteObject).toHaveBeenCalledWith(
      'photo-1.jpg',
      S3Buckets.MEDIA,
    );
  });
});
