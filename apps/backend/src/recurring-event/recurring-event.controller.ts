import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../aws/cognito/cognito.decorator';
import { RecurringEventQueryDto } from './dto/recurring-event-query.dto';
import { RecurringEventResponseDto } from './dto/recurring-event-response.dto';
import { RecurringEventService } from './recurring-event.service';

@ApiTags('Recurring Events')
@Controller('recurringEvent')
export class RecurringEventController {
  constructor(private readonly recurringEventService: RecurringEventService) {}

  /**
   * Public list of recurring events for a site.
   */
  @Get(':site_id')
  @Public()
  @ApiOperation({
    summary: 'List recurring events for a site',
    description:
      'Returns all recurring events for the given site, sorted by date. ' +
      'Supports sorting order (asc/desc) and pagination via query params. ' +
      'An empty array means the site exists but has no events. Unknown `site_id` returns 404.',
  })
  @ApiParam({
    name: 'site_id',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ type: [RecurringEventResponseDto] })
  @ApiNotFoundResponse({ description: 'Site not found' })
  getRecurringEventsBySite(
    @Param('site_id', ParseUUIDPipe) siteId: string,
    @Query() query: RecurringEventQueryDto,
  ): Promise<RecurringEventResponseDto[]> {
    return this.recurringEventService.findAllBySiteId(siteId, query);
  }
}
