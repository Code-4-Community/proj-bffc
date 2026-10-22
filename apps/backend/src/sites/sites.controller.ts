import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { SiteResponseDto } from './dto/site-response.dto';

@ApiTags('Sites')
@Controller('site')
export class SitesController {
  constructor(private sitesService: SitesService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get site details by ID',
    description:
      'Returns comprehensive site information including address, steward, gallery, plant inventory, partner organizations, and volunteer opportunities. Excludes events, announcements, and testimonials.',
  })
  @ApiParam({
    name: 'id',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Site details retrieved successfully',
    type: SiteResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Site not found',
  })
  async getSite(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SiteResponseDto> {
    return this.sitesService.findOne(id);
  }
}
