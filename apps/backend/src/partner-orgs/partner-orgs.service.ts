import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PartnerOrg } from '../entities/partner-org.entity';
import { Site } from '../entities/site.entity';
import { PartnerOrgDto } from '../sites/dto/partner-org.dto';

@Injectable()
export class PartnerOrgsService {
  constructor(
    @InjectRepository(PartnerOrg)
    private readonly partnerOrgRepo: Repository<PartnerOrg>,
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
  ) {}

  /**
   * All partner organizations for `siteId`, sorted by name.
   * Unknown site → 404. Known site with none → `[]`.
   */
  async findAllBySiteId(siteId: string): Promise<PartnerOrgDto[]> {
    const siteExists = await this.siteRepo.exists({ where: { id: siteId } });
    if (!siteExists) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    const partnerOrgs = await this.partnerOrgRepo.find({
      where: { site: { id: siteId } },
      order: { name: 'ASC' },
    });

    return partnerOrgs.map((org) => ({
      id: org.id,
      name: org.name,
    }));
  }
}
