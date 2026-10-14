import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Roles } from '../aws/cognito/cognito.decorator';
import { UserType } from '../entities/user.entity';
import { AdminEventQueryDto } from './dto/admin-event-query.dto';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('adminEvent')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Staff-only list of every BFFC event (Luma-linked admin events and
   * steward-published events), optionally filtered, in chronological order.
   */
  @Get()
  @Roles(UserType.ADMIN)
  @ApiOperation({
    summary: 'List all events across BFFC (staff only)',
    description:
      'Returns Luma-linked events and steward-run events in one chronological list. ' +
      'Filter with `site_id`, `event_type`, and `source_type` (`luma` | `steward`). ' +
      'An empty array means nothing matched the filters. Requires the Cognito `admin` group.',
  })
  @ApiOkResponse({ type: [AdminEventResponseDto] })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid Bearer token',
  })
  @ApiForbiddenResponse({
    description: 'Authenticated but not in the admin Cognito group',
  })
  getAdminEvents(
    @Query() query: AdminEventQueryDto,
  ): Promise<AdminEventResponseDto[]> {
    return this.eventsService.findAllForAdmin(query);
  }
}
