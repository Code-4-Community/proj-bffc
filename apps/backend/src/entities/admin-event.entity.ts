import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('admin_events')
export class AdminEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.adminEvents)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  description!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'time' })
  time!: string;

  @Column()
  place!: string;

  @Column()
  registrationLink!: string;
}
