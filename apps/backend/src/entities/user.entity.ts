import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Site } from './site.entity';
import { StewardEvent } from './steward-event.entity';
import { Announcement } from './announcement.entity';

export enum UserType {
  ADMIN = 'admin',
  STEWARD = 'steward',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'enum', enum: UserType })
  type!: UserType;

  @OneToMany(() => Site, (site) => site.steward)
  sites!: Site[];

  @OneToMany(() => StewardEvent, (event) => event.steward)
  stewardEvents!: StewardEvent[];

  @OneToMany(() => Announcement, (announcement) => announcement.steward)
  announcements!: Announcement[];
}
