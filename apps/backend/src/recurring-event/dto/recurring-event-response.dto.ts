import { ApiProperty } from '@nestjs/swagger';

export class RecurringEventSiteDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

/**
 * Recurring event returned by `GET /recurringEvent/{site_id}`.
 */
export class RecurringEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: RecurringEventSiteDto })
  site!: RecurringEventSiteDto;

  @ApiProperty({ description: 'Event name/title' })
  name!: string;

  @ApiProperty({
    description: 'Event date (YYYY-MM-DD)',
    example: '2026-10-25',
  })
  date!: string;

  @ApiProperty({
    description: 'Event start time (HH:MM:SS)',
    example: '14:00:00',
  })
  time!: string;

  @ApiProperty({ description: 'Event description' })
  description!: string;

  @ApiProperty({ description: 'Meeting location or place' })
  place!: string;
}

/**
 * Paginated response for recurring events.
 */
export class PaginatedRecurringEventsDto {
  @ApiProperty({ type: [RecurringEventResponseDto] })
  data!: RecurringEventResponseDto[];

  @ApiProperty({ description: 'Total number of events' })
  total!: number;

  @ApiProperty({ description: 'Current page number' })
  page!: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit!: number;
}
