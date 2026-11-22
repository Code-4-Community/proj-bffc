import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';
import { EventException } from './event-exception.entity';

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

@Entity('recurring_events')
export class RecurringEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.recurringEvents)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column()
  place!: string;

  @Column({ nullable: true })
  flyerS3Key?: string;

  @Column({ type: 'enum', enum: RecurrenceFrequency })
  frequency!: RecurrenceFrequency;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @OneToMany(() => EventException, (exception) => exception.event)
  exceptions!: EventException[];
}
