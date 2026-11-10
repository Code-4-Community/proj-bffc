import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';
import { Neighborhood } from './neighborhood.entity';
import { Point } from 'geojson';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Site, (site) => site.address)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @ManyToOne(() => Neighborhood, (neighborhood) => neighborhood.addresses)
  @JoinColumn({ name: 'neighborhood_id' })
  neighborhood?: Neighborhood;

  @Column()
  street!: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column()
  zip!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: Point;

  @Column({ type: 'jsonb', nullable: true })
  geojson!: Record<string, unknown>;
}
