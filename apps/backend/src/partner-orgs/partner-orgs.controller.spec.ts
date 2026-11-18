import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentMetadata,
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { IS_PUBLIC_KEY } from '../aws/cognito/cognito.decorator';
import { PartnerOrgDto } from '../sites/dto/partner-org.dto';
import { PartnerOrgsController } from './partner-orgs.controller';
import { PartnerOrgsService } from './partner-orgs.service';

describe('PartnerOrgsController', () => {
  let controller: PartnerOrgsController;
  let mockService: { findAllBySiteId: jest.Mock };

  const siteId = '1a3cc442-d41f-421d-af8e-311781e6c033';
  const sample: PartnerOrgDto[] = [
    { id: 'org-1', name: 'The Trustees of Reservations' },
  ];

  beforeEach(async () => {
    mockService = { findAllBySiteId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartnerOrgsController],
      providers: [{ provide: PartnerOrgsService, useValue: mockService }],
    }).compile();

    controller = module.get(PartnerOrgsController);
  });

  it('marks GET /partnerOrgs/:siteId as @Public()', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      PartnerOrgsController.prototype.getPartnerOrgsBySite,
    );
    expect(isPublic).toBe(true);
  });

  it('validates siteId with ParseUUIDPipe', () => {
    const args = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      PartnerOrgsController,
      'getPartnerOrgsBySite',
    );
    const siteIdArg = Object.values(args).find(
      (arg: { data?: string }) => arg.data === 'siteId',
    ) as { pipes: unknown[] };

    expect(siteIdArg.pipes).toContain(ParseUUIDPipe);
  });

  it('rejects a malformed siteId with 400 BadRequestException', async () => {
    const pipe = new ParseUUIDPipe();
    const metadata: ArgumentMetadata = {
      type: 'param',
      data: 'siteId',
      metatype: String,
    };

    await expect(pipe.transform('abc', metadata)).rejects.toThrow(
      BadRequestException,
    );
    await expect(pipe.transform(siteId, metadata)).resolves.toBe(siteId);
  });

  it('forwards siteId and returns the service result', async () => {
    mockService.findAllBySiteId.mockResolvedValue(sample);

    await expect(controller.getPartnerOrgsBySite(siteId)).resolves.toEqual(
      sample,
    );
    expect(mockService.findAllBySiteId).toHaveBeenCalledWith(siteId);
  });

  it('returns an empty array when the site has no partner orgs', async () => {
    mockService.findAllBySiteId.mockResolvedValue([]);

    await expect(controller.getPartnerOrgsBySite(siteId)).resolves.toEqual([]);
  });

  it('propagates NotFoundException when the site does not exist', async () => {
    mockService.findAllBySiteId.mockRejectedValue(
      new NotFoundException('Site not found'),
    );

    await expect(
      controller.getPartnerOrgsBySite('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });
});
