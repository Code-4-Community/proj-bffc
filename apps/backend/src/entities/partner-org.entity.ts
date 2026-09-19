import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Site } from './site.entity';

// NOTE: modeled as one-to-many (site -> many orgs). If an org can also
// belong to multiple sites, this needs to become a ManyToMany with a join table.
@Entity('partner_orgs')
export class PartnerOrg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Site, (site) => site.partnerOrgs)
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @Column()
  name!: string;
}
