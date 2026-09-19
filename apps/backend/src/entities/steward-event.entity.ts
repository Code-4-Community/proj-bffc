import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';
import { User } from './user.entity';

@Entity('steward_events')
export class StewardEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.stewardEvents)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @ManyToOne(() => User, (user) => user.stewardEvents)
  @JoinColumn({ name: 'steward_id' })
  steward!: User;

  @Column()
  description!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'time' })
  time!: string;

  @Column()
  place!: string;
}
