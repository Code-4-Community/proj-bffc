import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

/**
 * Request body for `POST /plant`. Only `name` is required, matching the
 * `plants` table where `plantName` is the only non-nullable text column.
 */
export class CreatePlantDto {
  @ApiProperty({ description: 'Plant name', example: 'Paw Paw' })
  @IsString({ message: 'name must be a string' })
  @Matches(/\S/, { message: 'name should not be empty' })
  name!: string;

  @ApiPropertyOptional({
    description: 'S3 key of the plant image. Returned as a full imageUrl.',
    example: 'plants/paw-paw.jpg',
  })
  @IsOptional()
  @IsString({ message: 'imageS3Key must be a string' })
  imageS3Key?: string;

  @ApiPropertyOptional({ example: 'A native North American fruit tree' })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @ApiPropertyOptional({ example: 'Tropical, custardy' })
  @IsOptional()
  @IsString({ message: 'flavor must be a string' })
  flavor?: string;

  @ApiPropertyOptional({ example: 'Late summer' })
  @IsOptional()
  @IsString({ message: 'harvestSeason must be a string' })
  harvestSeason?: string;

  @ApiPropertyOptional({ example: 'Pick when soft and fragrant' })
  @IsOptional()
  @IsString({ message: 'howToHarvest must be a string' })
  howToHarvest?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Recipe links or text',
    example: ['https://example.com/paw-paw-pudding', 'Paw paw smoothie'],
  })
  @IsOptional()
  @IsArray({ message: 'recipes must be an array of strings' })
  @IsString({ each: true, message: 'each value in recipes must be a string' })
  recipes?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'IDs of sites where this plant grows. Stewards may only link their own sites.',
  })
  @IsOptional()
  @IsArray({ message: 'siteIds must be an array of site IDs' })
  @IsUUID('all', {
    each: true,
    message: 'each value in siteIds must be a UUID',
  })
  @ArrayUnique({ message: 'siteIds must not contain duplicates' })
  siteIds?: string[];
}
