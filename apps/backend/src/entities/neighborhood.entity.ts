import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MultiPolygon } from 'geojson';
import { Address } from './address.entity';

@Entity('neighborhoods')
export class Neighborhood {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  // Boundary used to draw the neighborhood on the map
  @Column({
    type: 'geometry',
    spatialFeatureType: 'MultiPolygon',
    srid: 4326,
  })
  boundary!: MultiPolygon;

  @OneToMany(() => Address, (address) => address.neighborhood)
  addresses!: Address[];
}
