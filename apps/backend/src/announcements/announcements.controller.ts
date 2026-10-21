import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AnnouncementsService } from './announcements.service';
import { AnnouncementResponseDto } from './dto/announcement-response.dto';

@ApiTags('Announcements')
@Controller('announcement')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  /**
   * Public site-page list of steward announcements for one site.
   */
  @Get(':site_id')
  @ApiOperation({
    summary: 'List announcements for a site',
    description:
      'Returns steward-published announcements for the given site, newest first. ' +
      'An empty array means the site exists but has no announcements. Unknown `site_id` is 404.',
  })
  @ApiParam({
    name: 'site_id',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ type: [AnnouncementResponseDto] })
  @ApiNotFoundResponse({ description: 'Site not found' })
  getAnnouncementsBySite(
    @Param('site_id', ParseUUIDPipe) siteId: string,
  ): Promise<AnnouncementResponseDto[]> {
    return this.announcementsService.findAllBySiteId(siteId);
  }
}
