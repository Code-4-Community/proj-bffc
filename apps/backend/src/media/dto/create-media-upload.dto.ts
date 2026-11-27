import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateMediaUploadDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Site this media belongs to',
  })
  @IsUUID()
  siteId!: string;
}
