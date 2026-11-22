import { ApiProperty } from '@nestjs/swagger';
import { SiteType } from '../../entities/site.entity';

export class PlantHostSiteDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: SiteType })
  siteType: SiteType;
}

export class PlantResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: String, nullable: true })
  flavor: string | null;

  @ApiProperty({ type: String, nullable: true })
  harvestSeason: string | null;

  @ApiProperty({ type: String, nullable: true })
  howToHarvest: string | null;

  @ApiProperty({
    type: [String],
    description: 'Recipe links or text; empty array if none',
  })
  recipes: string[];

  @ApiProperty({
    type: [PlantHostSiteDto],
    description: 'Sites (of any type) where this plant grows; empty if none',
  })
  hostSites: PlantHostSiteDto[];
}
