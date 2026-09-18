import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.testimonials)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;
}
