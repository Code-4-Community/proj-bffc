import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { AWSS3Service } from './aws-s3.service';
import { S3Buckets } from './types/s3Buckets';
import { S3UploadInput } from './types/s3UploadInput';

const s3Mock = mockClient(S3Client);

describe('AWSS3Service', () => {
  const testBucket = 'test-bucket';
  // S3Buckets is empty in the scaffold; cast a sentinel value for tests.
  const testBucketEnum = 'TEST_BUCKET' as unknown as S3Buckets;
  const region = 'us-east-2';

  let service: AWSS3Service;

  beforeEach(() => {
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.AWS_REGION = region;
    process.env.AWS_TEST_BUCKET_NAME = testBucket;

    s3Mock.reset();
    service = new AWSS3Service();

    // The constructor resolves AWS_<BUCKET>_BUCKET_NAME for every member of
    // S3Buckets, but the scaffold enum is empty — inject the sentinel by hand.
    service['bucketNames'][testBucketEnum] = testBucket;
  });

  describe('upload', () => {
    const validInput: S3UploadInput = {
      fileBuffer: Buffer.from('test'),
      fileName: 'file.pdf',
      mimeType: 'application/pdf',
      bucket: testBucketEnum,
    };

    it('should upload file and return correct URL', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const url = await service.upload(validInput);

      const commandCall = s3Mock.call(0);
      const uploadedKey = (commandCall.args[0] as PutObjectCommand).input.Key;

      expect(s3Mock.calls()).toHaveLength(1);
      expect(uploadedKey).toMatch(/^file-\d{13}-[a-z0-9]{6}\.pdf$/);
      expect(url).toBe(
        `https://${testBucket}.s3.${region}.amazonaws.com/${uploadedKey}`,
      );
    });

    it('should throw error on upload failure', async () => {
      s3Mock.on(PutObjectCommand).rejects(new Error('fail'));

      await expect(service.upload(validInput)).rejects.toThrow(
        'File upload to AWS failed: Error: fail',
      );
    });

    describe('validateUploadInput', () => {
      it('should throw if fileBuffer is empty', async () => {
        await expect(
          service.upload({ ...validInput, fileBuffer: Buffer.alloc(0) }),
        ).rejects.toThrow('File buffer cannot be empty');
      });

      it('should throw if fileBuffer exceeds 100MB', async () => {
        const oversized = Buffer.alloc(100 * 1024 * 1024 + 1);
        await expect(
          service.upload({ ...validInput, fileBuffer: oversized }),
        ).rejects.toThrow(
          'File size exceeds the maximum allowed size of 100MB',
        );
      });

      it('should throw if fileName is empty', async () => {
        await expect(
          service.upload({ ...validInput, fileName: '   ' }),
        ).rejects.toThrow('File name cannot be empty');
      });

      it('should throw if fileName contains illegal characters', async () => {
        await expect(
          service.upload({ ...validInput, fileName: 'bad<file>.pdf' }),
        ).rejects.toThrow('File name contains illegal characters');
      });

      it('should throw if fileName contains path traversal', async () => {
        await expect(
          service.upload({ ...validInput, fileName: '..file.pdf' }),
        ).rejects.toThrow('File name cannot contain path traversal sequences');
      });

      it('should throw if mimeType is empty', async () => {
        await expect(
          service.upload({ ...validInput, mimeType: '' }),
        ).rejects.toThrow('MIME type cannot be empty');
      });

      it('should throw if mimeType is not in the allowed list', async () => {
        await expect(
          service.upload({
            ...validInput,
            mimeType: 'application/octet-stream',
          }),
        ).rejects.toThrow('MIME type not allowed: application/octet-stream');
      });

      it('should accept all allowed MIME types', async () => {
        s3Mock.on(PutObjectCommand).resolves({});
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
          'video/mp4',
          'video/quicktime',
          'audio/mpeg',
        ];
        for (const mimeType of allowedTypes) {
          await expect(
            service.upload({ ...validInput, mimeType }),
          ).resolves.toBeDefined();
        }
      });

      it('should throw if bucket env var is missing', async () => {
        // Remove the manually injected name so the lookup fails as expected.
        delete service['bucketNames'][testBucketEnum];

        await expect(service.upload(validInput)).rejects.toThrow(
          'Missing required environment variable for S3 bucket',
        );
      });
    });
  });

  describe('deleteObject', () => {
    it('sends DeleteObject with the resolved bucket and key', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await service.deleteObject('photo.jpg', testBucketEnum);

      const commandCall = s3Mock.call(0);
      expect((commandCall.args[0] as DeleteObjectCommand).input).toEqual({
        Bucket: testBucket,
        Key: 'photo.jpg',
      });
    });

    it('does not throw when S3 rejects the delete', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(new Error('denied'));
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined);

      await expect(
        service.deleteObject('photo.jpg', testBucketEnum),
      ).resolves.toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getImageData', () => {
    it('should return Uint8Array on success', async () => {
      const imageBytes = new Uint8Array([1, 2, 3]);
      s3Mock.on(GetObjectCommand).resolves({
        Body: {
          transformToByteArray: jest.fn().mockResolvedValue(imageBytes),
        } as unknown as GetObjectCommandOutput['Body'],
      });

      const result = await service.getImageData('photo.jpg', testBucketEnum);

      const commandCall = s3Mock.call(0);
      expect((commandCall.args[0] as GetObjectCommand).input.Bucket).toBe(
        testBucket,
      );
      expect(result).toBe(imageBytes);
    });

    it('should return null when response body is missing', async () => {
      s3Mock.on(GetObjectCommand).resolves({ Body: undefined });

      const result = await service.getImageData('photo.jpg', testBucketEnum);

      expect(result).toBeNull();
    });

    it('should return null for NoSuchKey', async () => {
      s3Mock
        .on(GetObjectCommand)
        .rejects(new NoSuchKey({ message: 'Not found', $metadata: {} }));

      const result = await service.getImageData('missing.jpg', testBucketEnum);

      expect(result).toBeNull();
    });

    it('should return null and log error for generic S3ServiceException', async () => {
      class TestS3Exception extends S3ServiceException {
        constructor() {
          super({
            name: 'AccessDenied',
            message: 'Access denied',
            $metadata: {},
            $fault: 'client',
          });
        }
      }
      s3Mock.on(GetObjectCommand).rejects(new TestS3Exception());
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined);

      const result = await service.getImageData('photo.jpg', testBucketEnum);

      expect(result).toBeNull();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `S3 error retrieving object: key=photo.jpg, bucket=${testBucketEnum}, error=Access denied`,
      );
    });

    it('should rethrow non-S3 errors', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('network error'));

      await expect(
        service.getImageData('photo.jpg', testBucketEnum),
      ).rejects.toThrow('network error');
    });
  });
});

// When your project adds a bucket to s3Buckets, add tests here following this pattern:
//
// it('should throw at startup if <BUCKET> env var is missing', () => {
//   delete process.env.AWS_MY_BUCKET_NAME;
//   expect(() => new AWSS3Service()).toThrow(
//     'Missing required environment variable for S3 bucket: MY_BUCKET',
//   );
// });
