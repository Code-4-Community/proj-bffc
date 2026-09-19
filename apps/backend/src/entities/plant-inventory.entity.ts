import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('plant_inventory')
export class PlantInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.plantInventory)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  plantName!: string;
}
