import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { MediaResponseDto } from './dto/media-response.dto';
import { MediaQueryDto, MediaType } from './dto/media-query.dto';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get(':siteId')
  @ApiOperation({
    summary: 'Get all media for a site',
    description:
      'Returns all published images and videos for a single site, newest first, in a paginated response. Optionally filter to a single media type.',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: MediaType,
    description: 'Restrict the response to only images or only videos',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based, default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page, per media type (default 20, max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Media retrieved successfully',
    type: MediaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Malformed site ID or invalid query parameter',
  })
  @ApiNotFoundResponse({
    description: 'Site not found',
  })
  async getMediaBySiteId(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: MediaQueryDto,
  ): Promise<MediaResponseDto> {
    return this.mediaService.getMediaBySiteId(siteId, query);
  }
}
