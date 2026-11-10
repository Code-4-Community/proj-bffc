import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaType } from './dto/media-query.dto';

describe('MediaController', () => {
  let controller: MediaController;
  let mockService: { getMediaBySiteId: jest.Mock };

  const siteId = '123e4567-e89b-12d3-a456-426614174000';

  const mockResponse: MediaResponseDto = {
    images: [
      {
        id: 'img-1',
        url: 'https://bucket.s3.us-east-2.amazonaws.com/img.jpg',
        title: 'Spring',
        description: 'blossoms',
        uploadedAt: new Date('2026-04-12T09:00:00Z'),
        uploadedBy: 'Jamie Chen',
      },
    ],
    videos: [],
    pagination: { page: 1, limit: 20, imagesTotal: 1, videosTotal: 0 },
  };

  beforeEach(async () => {
    mockService = { getMediaBySiteId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: mockService }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('delegates to the service and returns its result', async () => {
    mockService.getMediaBySiteId.mockResolvedValue(mockResponse);
    const query = { page: 1, limit: 20 };

    const result = await controller.getMediaBySiteId(siteId, query);

    expect(mockService.getMediaBySiteId).toHaveBeenCalledWith(siteId, query);
    expect(result).toEqual(mockResponse);
  });

  it('passes the type filter through to the service', async () => {
    mockService.getMediaBySiteId.mockResolvedValue(mockResponse);
    const query = { page: 1, limit: 20, type: MediaType.IMAGE };

    await controller.getMediaBySiteId(siteId, query);

    expect(mockService.getMediaBySiteId).toHaveBeenCalledWith(siteId, query);
  });

  it('propagates NotFoundException from the service', async () => {
    mockService.getMediaBySiteId.mockRejectedValue(
      new NotFoundException('Site not found'),
    );

    await expect(
      controller.getMediaBySiteId('00000000-0000-0000-0000-000000000000', {
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
