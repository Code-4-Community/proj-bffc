import { ApiProperty } from '@nestjs/swagger';

export class StewardDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}
