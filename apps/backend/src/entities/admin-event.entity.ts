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
  startTime!: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column()
  place!: string;

  @Column({ nullable: true })
  flyerS3Key?: string;

  @Column()
  registrationLink!: string;
}
