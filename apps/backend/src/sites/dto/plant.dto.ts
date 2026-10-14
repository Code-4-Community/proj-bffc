import { ApiProperty } from '@nestjs/swagger';

export class PlantDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  plantName: string;
}
