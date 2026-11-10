import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('plants')
export class Plant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  plantName!: string;

  @Column({ nullable: true })
  imageS3Key?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  flavor?: string;

  @Column({ nullable: true })
  harvestSeason?: string;

  @Column({ nullable: true })
  howToHarvest?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  recipes!: string[];

  @ManyToMany(() => Site, (site) => site.plants)
  @JoinTable({
    name: 'site_plants',
    joinColumn: { name: 'plant_id' },
    inverseJoinColumn: { name: 'site_id' },
  })
  hostSites!: Site[];
}
