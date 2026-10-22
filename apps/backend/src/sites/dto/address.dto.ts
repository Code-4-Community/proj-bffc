import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ example: 'Point' })
  type: string;

  @ApiProperty({
    example: [-71.1097, 42.3092],
    description: '[longitude, latitude]',
  })
  coordinates: [number, number];
}

export class AddressDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  street: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zip: string;

  @ApiProperty({ type: LocationDto, description: 'GeoJSON Point location' })
  location: LocationDto;
}
