import { ApiProperty } from '@nestjs/swagger';
import { MediaItemDto } from './media-item.dto';

export class MediaPaginationDto {
  @ApiProperty({ description: 'Current page (1-based)' })
  page: number;

  @ApiProperty({ description: 'Items per page, per media type' })
  limit: number;

  @ApiProperty({ description: 'Total number of images for the site' })
  imagesTotal: number;

  @ApiProperty({ description: 'Total number of videos for the site' })
  videosTotal: number;
}

export class MediaResponseDto {
  @ApiProperty({ type: [MediaItemDto], description: 'Images, newest first' })
  images: MediaItemDto[];

  @ApiProperty({ type: [MediaItemDto], description: 'Videos, newest first' })
  videos: MediaItemDto[];

  @ApiProperty({ type: MediaPaginationDto })
  pagination: MediaPaginationDto;
}
