import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StewardDto } from '../../sites/dto/steward.dto';

export class TestimonyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  quote: string;

  @ApiPropertyOptional({
    type: StewardDto,
    nullable: true,
  })
  steward: StewardDto | null;

  @ApiProperty()
  dateAdded: Date;
}
