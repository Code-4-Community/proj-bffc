import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { RecurringEvent } from './recurring-event.entity';

// Cancels or reschedules a single occurrence of a recurring event
@Entity('event_exceptions')
@Unique(['event', 'originalDate'])
export class EventException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RecurringEvent, (event) => event.exceptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'event_id' })
  event!: RecurringEvent;

  @Column({ type: 'date' })
  originalDate!: string;

  @Column({ default: true })
  cancelled!: boolean;

  // Shown to users, e.g. "Cancelled due to rain"
  @Column({ nullable: true })
  reason?: string;

  // Only for rescheduled occurrences
  @Column({ type: 'timestamptz', nullable: true })
  newStartTime?: Date;

  // Optional duration override (in minutes) for rescheduled occurrences
  @Column({ type: 'int', nullable: true })
  newDuration?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
