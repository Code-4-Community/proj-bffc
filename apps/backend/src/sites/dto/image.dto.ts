import { ApiProperty } from '@nestjs/swagger';

export class ImageDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Full URL to the image' })
  url: string;
}
