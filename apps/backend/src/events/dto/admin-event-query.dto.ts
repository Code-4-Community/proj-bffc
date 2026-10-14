import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

import { EventSourceType } from '../events.types';

/**
 * Query filters for `GET /adminEvent`. Omitted params are treated as
 * unconstrained; combining filters is AND-ed. Unknown `event_type` values
 * simply match no rows (empty list), while invalid `site_id` / `source_type`
 * fail validation with 400.
 */
export class AdminEventQueryDto {
  @ApiPropertyOptional({
    description: 'Restrict results to events at this site',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  site_id?: string;

  @ApiPropertyOptional({
    description:
      'Restrict results to this event category (exact match on stored event type)',
    example: 'harvest',
  })
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiPropertyOptional({
    enum: EventSourceType,
    description:
      'Restrict results by origin: `luma` (staff / Luma-linked) or `steward`',
  })
  @IsOptional()
  @IsEnum(EventSourceType)
  source_type?: EventSourceType;
}
