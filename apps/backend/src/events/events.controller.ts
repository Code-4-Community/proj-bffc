import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../aws/cognito/cognito.decorator';
import { AdminEventQueryDto } from './dto/admin-event-query.dto';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('adminEvent')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Public chronological list of Luma-linked admin events.
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'List Luma-linked admin events',
    description:
      'Returns staff / Luma-linked events in chronological order. ' +
      'Filter with `site_id`. An empty array means nothing matched. ' +
      'Steward-run events are not included (separate endpoint).',
  })
  @ApiOkResponse({ type: [AdminEventResponseDto] })
  getAdminEvents(
    @Query() query: AdminEventQueryDto,
  ): Promise<AdminEventResponseDto[]> {
    return this.eventsService.findAllForAdmin(query);
  }
}
