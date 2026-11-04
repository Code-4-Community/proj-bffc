import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminEventSiteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * Luma-linked admin event returned by `GET /adminEvent`.
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

  @ApiPropertyOptional({
    description: 'Registration URL, when the event has one',
    example: 'https://lu.ma/example-harvest',
  })
  registrationLink?: string;
}
