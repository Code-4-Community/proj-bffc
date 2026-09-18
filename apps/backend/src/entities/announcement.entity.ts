import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';
import { User } from './user.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'date' })
  date!: string;

  @ManyToOne(() => User, (user) => user.announcements)
  @JoinColumn({ name: 'steward_id' })
  steward!: User;

  @ManyToOne(() => Site, (site) => site.announcements)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column({ type: 'text' })
  info!: string;
}
