import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.images)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  s3Key!: string;
}
