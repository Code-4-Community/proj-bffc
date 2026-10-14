import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EventSourceType } from '../events.types';

export class AdminEventSiteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * Unified event row returned by `GET /adminEvent`. Luma-linked admin events
 * and steward-published events share this shape so staff can scan everything
 * in one list.
 */
export class AdminEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: AdminEventSiteDto })
  site!: AdminEventSiteDto;

  @ApiProperty({ description: 'Event title' })
  name!: string;

  @ApiProperty({
    description: 'Calendar date (YYYY-MM-DD)',
    example: '2026-10-25',
  })
  date!: string;

  @ApiProperty({
    description: 'Local start time (HH:MM:SS)',
    example: '14:00:00',
  })
  time!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ example: 'harvest' })
  eventType!: string;

  @ApiProperty({ enum: EventSourceType })
  sourceType!: EventSourceType;

  @ApiPropertyOptional({
    description: 'Registration URL; present only for Luma-linked events',
    example: 'https://lu.ma/example-harvest',
  })
  registrationLink?: string;
}
