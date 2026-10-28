import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Site } from './site.entity';
import { User } from './user.entity';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.testimonials)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'steward_id' })
  steward?: User;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
