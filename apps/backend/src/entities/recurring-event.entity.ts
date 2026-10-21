import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('recurring-events')
export class RecurringEvent {
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

  @Column({ type: 'date' })
  recurringDate!: string;
}
