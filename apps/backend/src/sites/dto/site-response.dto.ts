import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SiteType } from '../../entities/site.entity';
import { AddressDto } from './address.dto';
import { StewardDto } from './steward.dto';
import { ImageDto } from './image.dto';
import { VideoDto } from './video.dto';
import { PlantDto } from './plant.dto';
import { PartnerOrgDto } from './partner-org.dto';
import { VolunteerOpportunityDto } from './volunteer-opportunity.dto';

export class SiteResponseDto {
  @ApiProperty({ description: 'Unique site identifier', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Site name' })
  name: string;

  @ApiProperty({
    enum: SiteType,
    description: 'Site classification type',
    example: 'existing_land_trust',
  })
  type: SiteType;

  @ApiProperty({ description: 'Site history and background' })
  history: string;

  @ApiProperty({ description: 'Accessibility information' })
  accessibility: string;

  @ApiPropertyOptional({
    type: AddressDto,
    description: 'Site address and location',
    nullable: true,
  })
  address: AddressDto | null;

  @ApiPropertyOptional({
    type: StewardDto,
    description: 'Site steward information',
    nullable: true,
  })
  steward: StewardDto | null;

  @ApiProperty({ type: [ImageDto], description: 'Site image gallery' })
  images: ImageDto[];

  @ApiProperty({ type: [VideoDto], description: 'Site videos' })
  videos: VideoDto[];

  @ApiProperty({
    type: [PlantDto],
    description: 'Plant inventory / Meet the plants',
  })
  plantInventory: PlantDto[];

  @ApiProperty({
    type: [VolunteerOpportunityDto],
    description: 'Volunteer opportunities',
  })
  volunteerOpportunities: VolunteerOpportunityDto[];

  @ApiProperty({ type: [PartnerOrgDto], description: 'Partner organizations' })
  partnerOrgs: PartnerOrgDto[];
}
