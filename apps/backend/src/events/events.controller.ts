import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Public } from '../aws/cognito/cognito.decorator';
import { Roles } from '../aws/cognito/roles.decorator';
import { RolesGuard } from '../aws/cognito/roles.guard';
import { UserType } from '../entities/user.entity';
import { AdminEventQueryDto } from './dto/admin-event-query.dto';
import { AdminEventResponseDto } from './dto/admin-event-response.dto';
import { CreateAdminEventDto } from './dto/create-admin-event.dto';
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

  /**
   * Admin-only: publish a Luma-linked event on a site.
   */
  @Post()
  @Roles(UserType.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Luma-linked admin event',
    description:
      'Admin only. Publishes an organization-wide event on a site, linked ' +
      'to its Luma registration page.',
  })
  @ApiCreatedResponse({ type: AdminEventResponseDto })
  @ApiBadRequestResponse({
    description: 'Missing or invalid field; message names the problem',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @ApiForbiddenResponse({ description: 'Caller is not an admin' })
  @ApiNotFoundResponse({ description: 'site_id does not match any site' })
  createAdminEvent(
    @Body() body: CreateAdminEventDto,
  ): Promise<AdminEventResponseDto> {
    return this.eventsService.createAdminEvent(body);
  }
}
