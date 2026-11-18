import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export class MediaQueryDto {
  @ApiPropertyOptional({
    enum: MediaType,
    description:
      'Restrict the response to a single media type. Any other value returns 400.',
  })
  @IsOptional()
  @IsIn(Object.values(MediaType))
  type?: MediaType;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page, per media type',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
