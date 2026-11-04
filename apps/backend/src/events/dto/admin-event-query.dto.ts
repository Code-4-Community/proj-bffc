import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query filters for `GET /adminEvent`. Omitted params are unconstrained.
 * Invalid `site_id` (not a UUID) fails validation with 400.
 */
export class AdminEventQueryDto {
  @ApiPropertyOptional({
    description: 'Restrict results to events at this site',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  site_id?: string;
}
