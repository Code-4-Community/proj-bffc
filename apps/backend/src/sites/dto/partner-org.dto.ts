import { ApiProperty } from '@nestjs/swagger';

export class PartnerOrgDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}
