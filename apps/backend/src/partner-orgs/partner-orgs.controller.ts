import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../aws/cognito/cognito.decorator';
import { PartnerOrgDto } from '../sites/dto/partner-org.dto';
import { PartnerOrgsService } from './partner-orgs.service';

@ApiTags('Partner Orgs')
@Controller('partnerOrgs')
export class PartnerOrgsController {
  constructor(private readonly partnerOrgsService: PartnerOrgsService) {}

  /**
   * Public site-page list of partner organizations for one site.
   */
  @Get(':siteId')
  @Public()
  @ApiOperation({
    summary: 'List partner organizations for a site',
    description:
      'Returns the partner organizations associated with the given site, sorted by name. ' +
      'An empty array means the site exists but has no partners. Unknown `siteId` is 404.',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site UUID',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({ type: [PartnerOrgDto] })
  @ApiBadRequestResponse({ description: 'siteId is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Site not found' })
  getPartnerOrgsBySite(
    @Param('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<PartnerOrgDto[]> {
    return this.partnerOrgsService.findAllBySiteId(siteId);
  }
}
