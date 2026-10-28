import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.videos)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  s3Key!: string;

  @Column({ type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  uploadedAt!: Date;
}
