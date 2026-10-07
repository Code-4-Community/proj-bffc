import { ApiProperty } from '@nestjs/swagger';

export class VolunteerOpportunityDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ format: 'date', example: '2026-10-18' })
  date: string;
}
