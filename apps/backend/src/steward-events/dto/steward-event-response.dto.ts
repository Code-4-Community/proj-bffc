import { ApiProperty } from '@nestjs/swagger';

export class StewardEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Community Workday' })
  name: string;

  @ApiProperty({ example: 'Monthly cleanup and mulching. Tools provided.' })
  description: string;

  @ApiProperty({ format: 'date', example: '2026-09-20' })
  date: string;

  @ApiProperty({ example: '10:00:00' })
  time: string;

  @ApiProperty({
    description: 'Meeting/location info',
    example: 'Meet at the barn',
  })
  place: string;

  @ApiProperty({
    enum: ['steward'],
    description: 'Marks the event as steward-run, vs. admin (Luma) events',
  })
  eventType: 'steward';
}
