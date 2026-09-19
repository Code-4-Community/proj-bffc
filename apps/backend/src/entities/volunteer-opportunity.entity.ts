import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('volunteer_opportunities')
export class VolunteerOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Site, (site) => site.volunteerOpportunities)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column({ type: 'date' })
  date!: string;
}
