import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;
  let mockService: { findAllBySiteId: jest.Mock };

  const siteId = '1a3cc442-d41f-421d-af8e-311781e6c033';
  const sample: AnnouncementResponseDto[] = [
    {
      id: 'ann-1',
      content: 'Paw paws are ripe — come pick this weekend.',
      date: '2026-10-12',
      author: { id: 'steward-id', name: 'Jamie Chen' },
    },
  ];

  beforeEach(async () => {
    mockService = { findAllBySiteId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useValue: mockService }],
    }).compile();

    controller = module.get(AnnouncementsController);
  });

  it('forwards site_id and returns the service result', async () => {
    mockService.findAllBySiteId.mockResolvedValue(sample);

    await expect(controller.getAnnouncementsBySite(siteId)).resolves.toEqual(
      sample,
    );
    expect(mockService.findAllBySiteId).toHaveBeenCalledWith(siteId);
  });

  it('returns an empty array when the site has no announcements', async () => {
    mockService.findAllBySiteId.mockResolvedValue([]);

    await expect(controller.getAnnouncementsBySite(siteId)).resolves.toEqual(
      [],
    );
  });

  it('propagates NotFoundException when the site does not exist', async () => {
    mockService.findAllBySiteId.mockRejectedValue(
      new NotFoundException('Site not found'),
    );

    await expect(
      controller.getAnnouncementsBySite('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });
});
