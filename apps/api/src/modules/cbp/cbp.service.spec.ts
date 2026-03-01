import { PrismaService } from '@gbferry/database';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { ACE_GATEWAY, ACEGateway, ACESubmissionResult } from './ace-gateway.interface';
import { CbpTransformer } from './cbp-transformer.service';
import { CBPService } from './cbp.service';

// ─── Typed factory mocks (testing-patterns skill: getMockX pattern) ──────────
const makeMockVessel = () => ({
  id: 'vessel-1',
  name: 'MV Test',
  imoNumber: 'IMO1234567',
  callSign: 'TEST1',
  flagState: 'BHS',
  crewMembers: [
    {
      familyName: 'Doe',
      givenNames: 'John',
      role: 'MASTER',
      nationality: 'USA',
      dateOfBirth: new Date('1980-01-01'),
      passportNumber: 'ENC:PASSPORT123',
      status: 'ACTIVE',
      deletedAt: null,
    },
  ],
});

const makeMockSubmissionResult = (): ACESubmissionResult => ({
  status: 'ACCEPTED',
  submissionId: 'sub-123',
  timestamp: new Date(),
  message: 'Success',
});

describe('CBPService', () => {
  let service: CBPService;

  // ─── Strongly-typed partial mocks ─────────────────────────────────────────
  // Using explicit typed objects instead of `any` per the NestJS skill suggestion.
  // For full DeepMockProxy support, `jest-mock-extended` is now a dev dependency.
  let prisma: jest.Mocked<Pick<PrismaService, 'vessel' | 'cbpSubmission'>>;
  let audit: jest.Mocked<Pick<AuditService, 'log'>>;
  let aceGateway: jest.Mocked<ACEGateway>;
  let cbpTransformer: jest.Mocked<Pick<CbpTransformer, 'toAcePayload'>>;

  beforeEach(async () => {
    const vessel = makeMockVessel();

    aceGateway = {
      submitCrewList: jest.fn().mockResolvedValue(makeMockSubmissionResult()),
    } as jest.Mocked<ACEGateway>;

    prisma = {
      vessel: { findUnique: jest.fn().mockResolvedValue(vessel) } as any,
      cbpSubmission: { create: jest.fn().mockResolvedValue({ id: 'submission-1' }) } as any,
    };

    audit = { log: jest.fn().mockResolvedValue(true) };

    cbpTransformer = {
      toAcePayload: jest.fn().mockReturnValue({
        vesselId: vessel.id,
        vesselInfo: { name: vessel.name, imoNumber: vessel.imoNumber, flag: vessel.flagState },
        crew: [],
        submissionTime: new Date(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CBPService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        { provide: CbpTransformer, useValue: cbpTransformer },
        { provide: ACE_GATEWAY, useValue: aceGateway },
      ],
    }).compile();

    service = module.get<CBPService>(CBPService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitCrewList', () => {
    it('should delegate transformation to CbpTransformer', async () => {
      await service.submitCrewList('vessel-1', 'user-1', 'I_418');
      expect(cbpTransformer.toAcePayload).toHaveBeenCalledTimes(1);
    });

    it('should successfully submit crew list and log audit', async () => {
      const result = await service.submitCrewList('vessel-1', 'user-1', 'I_418');

      expect(result.status).toBe('ACCEPTED');
      expect(prisma.vessel.findUnique).toHaveBeenCalled();
      expect(aceGateway.submitCrewList).toHaveBeenCalled();
      expect(prisma.cbpSubmission.create).toHaveBeenCalled();
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CBP_APIS_SUBMITTED',
          entityType: 'cbpSubmission',
        })
      );
    });

    it('should throw NotFoundException if vessel does not exist', async () => {
      (prisma.vessel.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.submitCrewList('invalid-id', 'user-1', 'I_418')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
