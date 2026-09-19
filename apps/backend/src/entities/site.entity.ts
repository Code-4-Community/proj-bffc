import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
import { AdminEvent } from './admin-event.entity';
import { StewardEvent } from './steward-event.entity';
import { PlantInventory } from './plant-inventory.entity';
import { Image } from './image.entity';
import { Video } from './video.entity';
import { Testimonial } from './testimonial.entity';
import { Announcement } from './announcement.entity';
import { PartnerOrg } from './partner-org.entity';
import { VolunteerOpportunity } from './volunteer-opportunity.entity';
import { Address } from './address.entity';

export enum SiteType {
  EXISTING_LAND_TRUST = 'existing_land_trust',
  EXISTING_COALITION = 'existing_coalition',
  EMERGING_LAND_TRUST = 'emerging_land_trust',
  EMERGING_COALITION = 'emerging_coalition',
}

@Entity('sites')
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user) => user.sites)
  @JoinColumn({ name: 'user_id' })
  steward!: User;

  @Column()
  history!: string;

  @OneToOne(() => Address, (address) => address.site)
  address!: Address;

  @Column()
  accessibility!: string;

  @Column({ type: 'enum', enum: SiteType })
  type!: SiteType;

  @OneToMany(() => AdminEvent, (event) => event.site)
  adminEvents!: AdminEvent[];

  @OneToMany(() => StewardEvent, (event) => event.site)
  stewardEvents!: StewardEvent[];

  @OneToMany(() => PlantInventory, (plant) => plant.site)
  plantInventory!: PlantInventory[];

  @OneToMany(() => Image, (image) => image.site)
  images!: Image[];

  @OneToMany(() => Video, (video) => video.site)
  videos!: Video[];

  @OneToMany(() => Testimonial, (testimonial) => testimonial.site)
  testimonials!: Testimonial[];

  @OneToMany(() => Announcement, (announcement) => announcement.site)
  announcements!: Announcement[];

  @OneToMany(() => PartnerOrg, (org) => org.site)
  partnerOrgs!: PartnerOrg[];

  @OneToMany(() => VolunteerOpportunity, (opp) => opp.site)
  volunteerOpportunities!: VolunteerOpportunity[];
}
