import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { StewardEventsController } from './steward-events.controller';
import { StewardEventsService } from './steward-events.service';
import { StewardEventResponseDto } from './dto/steward-event-response.dto';

describe('StewardEventsController', () => {
  let controller: StewardEventsController;
  let mockService: { findBySite: jest.Mock };

  const siteId = '123e4567-e89b-12d3-a456-426614174000';

  const mockEvents: StewardEventResponseDto[] = [
    {
      id: 'event-1',
      name: 'Community Workday',
      description: 'Monthly cleanup and mulching.',
      date: '2026-09-20',
      time: '10:00:00',
      place: 'Meet at the barn',
      eventType: 'steward',
    },
  ];

  beforeEach(async () => {
    mockService = { findBySite: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StewardEventsController],
      providers: [{ provide: StewardEventsService, useValue: mockService }],
    }).compile();

    controller = module.get<StewardEventsController>(StewardEventsController);
  });

  describe('getStewardEvents', () => {
    it('should return steward events for the given site', async () => {
      mockService.findBySite.mockResolvedValue(mockEvents);

      const result = await controller.getStewardEvents(siteId);

      expect(mockService.findBySite).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockEvents);
    });

    it('should return an empty array when the site has no steward events', async () => {
      mockService.findBySite.mockResolvedValue([]);

      const result = await controller.getStewardEvents(siteId);

      expect(result).toEqual([]);
    });
  });

  describe('siteId validation', () => {
    const pipe = new ParseUUIDPipe();
    const metadata = { type: 'query' as const, data: 'siteId' };

    it('should reject a missing siteId', async () => {
      await expect(pipe.transform(undefined, metadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a non-UUID siteId', async () => {
      await expect(pipe.transform('not-a-uuid', metadata)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept a valid UUID siteId', async () => {
      await expect(pipe.transform(siteId, metadata)).resolves.toBe(siteId);
    });
  });
});
