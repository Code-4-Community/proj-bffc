import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { StewardEventsService } from './steward-events.service';
import { StewardEventResponseDto } from './dto/steward-event-response.dto';

@ApiTags('Events')
@Controller('stewardEvent')
export class StewardEventsController {
  constructor(private stewardEventsService: StewardEventsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'List steward-published events for a site',
    description:
      'Sorted by date, then time. Returns an empty array if the site has none.',
  })
  @ApiOkResponse({ type: [StewardEventResponseDto] })
  @ApiBadRequestResponse({ description: 'siteId is missing or not a UUID' })
  getStewardEvents(
    @Query('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<StewardEventResponseDto[]> {
    return this.stewardEventsService.findBySite(siteId);
  }
}
