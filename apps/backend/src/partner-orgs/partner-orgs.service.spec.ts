import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { PartnerOrg } from '../entities/partner-org.entity';
import { Site } from '../entities/site.entity';
import { PartnerOrgsService } from './partner-orgs.service';

const SITE_ID = '1a3cc442-d41f-421d-af8e-311781e6c033';

function partnerOrg(id: string, name: string): PartnerOrg {
  return { id, name, site: { id: SITE_ID } as Site } as PartnerOrg;
}

describe('PartnerOrgsService', () => {
  let service: PartnerOrgsService;
  let partnerOrgRepo: { find: jest.Mock };
  let siteRepo: { exists: jest.Mock };

  beforeEach(async () => {
    partnerOrgRepo = { find: jest.fn().mockResolvedValue([]) };
    siteRepo = { exists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerOrgsService,
        { provide: getRepositoryToken(PartnerOrg), useValue: partnerOrgRepo },
        { provide: getRepositoryToken(Site), useValue: siteRepo },
      ],
    }).compile();

    service = module.get(PartnerOrgsService);
  });

  describe('findAllBySiteId', () => {
    it('throws NotFoundException with a clear message when the site does not exist', async () => {
      siteRepo.exists.mockResolvedValue(false);

      await expect(service.findAllBySiteId(SITE_ID)).rejects.toThrow(
        new NotFoundException(`Site with ID ${SITE_ID} not found`),
      );
      expect(partnerOrgRepo.find).not.toHaveBeenCalled();
    });

    it('returns an empty array when the site has no partner orgs', async () => {
      partnerOrgRepo.find.mockResolvedValue([]);

      await expect(service.findAllBySiteId(SITE_ID)).resolves.toEqual([]);
      expect(siteRepo.exists).toHaveBeenCalledWith({ where: { id: SITE_ID } });
    });

    it('queries partner orgs for the site sorted by name', async () => {
      await service.findAllBySiteId(SITE_ID);

      expect(partnerOrgRepo.find).toHaveBeenCalledWith({
        where: { site: { id: SITE_ID } },
        order: { name: 'ASC' },
      });
    });

    it('maps each partner org to { id, name } only', async () => {
      partnerOrgRepo.find.mockResolvedValue([
        partnerOrg('org-1', 'Boston Natural Areas Network'),
        partnerOrg('org-2', 'The Trustees of Reservations'),
      ]);

      const results = await service.findAllBySiteId(SITE_ID);

      expect(results).toEqual([
        { id: 'org-1', name: 'Boston Natural Areas Network' },
        { id: 'org-2', name: 'The Trustees of Reservations' },
      ]);
      results.forEach((row) => expect(row).not.toHaveProperty('site'));
    });
  });
});
