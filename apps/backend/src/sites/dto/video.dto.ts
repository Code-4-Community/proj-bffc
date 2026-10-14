import { ApiProperty } from '@nestjs/swagger';

export class VideoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Full URL to the video' })
  url: string;
}
