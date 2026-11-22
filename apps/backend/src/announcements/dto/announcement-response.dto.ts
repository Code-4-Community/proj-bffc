import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementAuthorDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Steward who published the announcement' })
  name: string;
}

/**
 * One steward announcement on a public site detail page.
 * `content` is the stored `info` column; `author` is the posting steward
 * (id + name only — email is never returned).
 */
export class AnnouncementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    description:
      'Announcement body (upcoming events, workdays, what is ripe, etc.)',
  })
  content: string;

  @ApiProperty({
    description: 'Date published (YYYY-MM-DD)',
    example: '2026-10-12',
  })
  date: string;

  @ApiProperty({ type: AnnouncementAuthorDto })
  author: AnnouncementAuthorDto;
}
