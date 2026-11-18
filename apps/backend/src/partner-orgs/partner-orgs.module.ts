import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PartnerOrg } from '../entities/partner-org.entity';
import { Site } from '../entities/site.entity';
import { PartnerOrgsController } from './partner-orgs.controller';
import { PartnerOrgsService } from './partner-orgs.service';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerOrg, Site])],
  controllers: [PartnerOrgsController],
  providers: [PartnerOrgsService],
})
export class PartnerOrgsModule {}
