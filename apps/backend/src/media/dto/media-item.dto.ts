import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MediaItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Full public URL to the media file (unsigned)' })
  url: string;

  @ApiPropertyOptional({
    description: 'Display title for the media item',
    nullable: true,
  })
  title: string | null;

  @ApiPropertyOptional({
    description: 'Longer description for the media item',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'When the item was uploaded (ISO 8601)',
    type: String,
    format: 'date-time',
  })
  uploadedAt: Date;

  @ApiPropertyOptional({
    description: "Name of the site's steward or staff member, if available",
    nullable: true,
  })
  uploadedBy: string | null;
}
