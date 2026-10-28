import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { TestimonyService } from './testimony.service';
import { TestimonyResponseDto } from './dto/testimony-response.dto';

@ApiTags('Testimony')
@Controller('testimony')
export class TestimonyController {
  constructor(private testimonyService: TestimonyService) {}

  @Get(':site_id')
  @ApiOperation({
    summary: 'List testimonies for a site',
    description:
      'Returns all steward or community testimonies associated with a given site. Returns an empty array if the site has no testimonies.',
  })
  @ApiParam({
    name: 'site_id',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Testimonies retrieved successfully',
    type: [TestimonyResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Site not found',
  })
  async getTestimonies(
    @Param('site_id', ParseUUIDPipe) siteId: string,
  ): Promise<TestimonyResponseDto[]> {
    return this.testimonyService.findBySiteId(siteId);
  }
}
