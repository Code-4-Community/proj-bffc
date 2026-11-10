import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Site } from './site.entity';

@Entity('partner_orgs')
export class PartnerOrg {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToMany(() => Site, (site) => site.partnerOrgs)
  @JoinTable({
    name: 'site_partners',
    joinColumn: { name: 'partner_org_id' },
    inverseJoinColumn: { name: 'site_id' },
  })
  sites!: Site[];

  @Column()
  name!: string;
}
