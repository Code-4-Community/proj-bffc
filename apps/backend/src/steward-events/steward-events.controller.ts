import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { StewardEventsService } from './steward-events.service';
import { StewardEventResponseDto } from './dto/steward-event-response.dto';

@ApiTags('Events')
@Controller('stewardEvent')
export class StewardEventsController {
  constructor(private stewardEventsService: StewardEventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List steward-published events for a site',
    description:
      'Returns informational events published by the steward of the given site, sorted chronologically (date, then time). These have no RSVP tracking. Returns an empty array if the site has no steward events.',
  })
  @ApiQuery({
    name: 'siteId',
    description: 'Site UUID',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiResponse({
    status: 200,
    description: 'Steward events retrieved successfully',
    type: StewardEventResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'siteId is missing or not a valid UUID',
  })
  async getStewardEvents(
    @Query('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<StewardEventResponseDto[]> {
    return this.stewardEventsService.findBySite(siteId);
  }
}
