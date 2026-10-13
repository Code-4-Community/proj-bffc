import { ApiProperty } from '@nestjs/swagger';

export const STEWARD_EVENT_TYPE = 'steward';

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
    example: 'Fowler Clark Epstein Farm — meet at the barn',
  })
  place: string;

  @ApiProperty({
    enum: [STEWARD_EVENT_TYPE],
    description:
      'Always "steward". Lets clients mark steward-run events when listing them alongside admin (Luma) events.',
  })
  eventType: typeof STEWARD_EVENT_TYPE;
}
