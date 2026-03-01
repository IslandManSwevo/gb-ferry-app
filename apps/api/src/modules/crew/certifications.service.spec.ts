/**
 * certifications.service.spec.ts
 *
 * Unit tests for CertificationsService covering:
 * - create() happy path and validation errors
 * - findAll() with filters
 * - getExpiring() bounds validation
 * - verifyAllForCrew() graceful partial failure via Promise.allSettled
 *
 * Skills applied:
 * - nestjs-expert: plain object mocks, 3-param constructor
 * - testing-patterns: factory functions, one behavior per test
 */

import { BadRequestException } from '@nestjs/common';
import { CertificationsService } from './certifications.service';

// ─── Factories ────────────────────────────────────────────────────────────────

const makeDate = (offsetDays: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
};

const getMockCertification = (overrides: Record<string, any> = {}) => ({
  id: 'cert-001',
  crewId: 'crew-001',
  type: 'STCW_COC',
  issueDate: makeDate(-365),
  expiryDate: makeDate(365),
  issuingAuthority: 'BMA',
  certificateNumber: 'BHS-001',
  status: 'VALID',
  documentVerified: false,
  ...overrides,
});

const getMockCreateDto = (overrides: Record<string, any> = {}) => ({
  crewId: 'crew-001',
  type: 'STCW_COC' as any,
  issueDate: makeDate(-30),
  expiryDate: makeDate(365),
  issuingAuthority: 'Bahamas Maritime Authority',
  certificationNumber: 'BHS-COC-001',
  ...overrides,
});

const getMockPrisma = () => ({
  crewMember: {
    findUnique: jest.fn().mockResolvedValue({ id: 'crew-001' }),
  },
  certification: {
    create: jest.fn().mockResolvedValue(getMockCertification()),
    findMany: jest.fn().mockResolvedValue([getMockCertification()]),
    findUnique: jest.fn().mockResolvedValue(getMockCertification()),
    update: jest
      .fn()
      .mockResolvedValue(getMockCertification({ documentVerified: true, status: 'VALID' })),
  },
  user: {
    findUnique: jest
      .fn()
      .mockResolvedValue({ id: 'system', email: 'system@gbferry.internal', role: 'system' }),
    create: jest.fn().mockResolvedValue({ id: 'system' }),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'log-001' }),
  },
});

const getMockAuditService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

const getMockVerificationService = () => ({
  verifyCertification: jest.fn().mockResolvedValue({
    verified: true,
    status: 'VALID',
    verificationDate: new Date(),
    authorityResponse: { source: 'BMA Online Mock' },
    notes: 'BMA Online Verification',
  }),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CertificationsService', () => {
  let service: CertificationsService;
  let prisma: ReturnType<typeof getMockPrisma>;
  let auditService: ReturnType<typeof getMockAuditService>;
  let verificationService: ReturnType<typeof getMockVerificationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = getMockPrisma();
    auditService = getMockAuditService();
    verificationService = getMockVerificationService();
    service = new CertificationsService(
      prisma as any,
      auditService as any,
      verificationService as any
    );
  });

  // ── create() ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('creates a certification for an existing crew member', async () => {
      const result = await service.create(getMockCreateDto(), 'user-001');
      expect(prisma.certification.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('cert-001');
    });

    it('throws when Prisma cannot connect to the crew record (missing crew)', async () => {
      // create() uses crew: { connect: { id } } — Prisma throws a P2025 RecordNotFound error
      // when the crew doesn't exist. The service propagates this as-is.
      prisma.certification.create.mockRejectedValue(
        Object.assign(new Error('Record to connect not found'), { code: 'P2025' })
      );
      await expect(service.create(getMockCreateDto(), 'user-001')).rejects.toThrow();
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when expiryDate is in the past', async () => {
      await expect(
        service.create(getMockCreateDto({ expiryDate: makeDate(-1) }), 'user-001')
      ).rejects.toThrow(BadRequestException);
    });

    it('logs a CERTIFICATION_CREATE audit entry on success', async () => {
      await service.create(getMockCreateDto(), 'user-001');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CERTIFICATION_CREATE' })
      );
    });
  });

  // ── findAll() ────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns certifications with total from array length', async () => {
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('passes crewId filter to Prisma where clause', async () => {
      await service.findAll({ crewId: 'crew-001' });
      expect(prisma.certification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ crewId: 'crew-001' }),
        })
      );
    });

    it('throws BadRequestException for negative expiringWithinDays', async () => {
      await expect(service.findAll({ expiringWithinDays: -1 })).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // ── getExpiring() ────────────────────────────────────────────────────────────

  describe('getExpiring()', () => {
    it('accepts default 30-day window', async () => {
      prisma.certification.findMany.mockResolvedValue([]);
      await expect(service.getExpiring()).resolves.not.toThrow();
    });

    it('throws BadRequestException when withinDays < 1', async () => {
      await expect(service.getExpiring(0)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when withinDays > 365', async () => {
      await expect(service.getExpiring(366)).rejects.toThrow(BadRequestException);
    });

    it('accepts boundary values 1 and 365', async () => {
      prisma.certification.findMany.mockResolvedValue([]);
      await expect(service.getExpiring(1)).resolves.not.toThrow();
      await expect(service.getExpiring(365)).resolves.not.toThrow();
    });
  });

  // ── verifyAllForCrew() ──────────────────────────────────────────────────────

  describe('verifyAllForCrew()', () => {
    it('calls verify for each certification and completes without throwing', async () => {
      prisma.certification.findMany.mockResolvedValue([
        getMockCertification({ id: 'cert-001' }),
        getMockCertification({ id: 'cert-002' }),
      ]);
      prisma.certification.findUnique
        .mockResolvedValueOnce(getMockCertification({ id: 'cert-001' }))
        .mockResolvedValueOnce(getMockCertification({ id: 'cert-002' }));

      await expect(service.verifyAllForCrew('crew-001', 'user-001')).resolves.not.toThrow();
      expect(prisma.certification.update).toHaveBeenCalledTimes(2);
    });

    it('gracefully handles partial verification failures via Promise.allSettled', async () => {
      prisma.certification.findMany.mockResolvedValue([
        getMockCertification({ id: 'cert-ok' }),
        getMockCertification({ id: 'cert-fail' }),
      ]);
      prisma.certification.findUnique
        .mockResolvedValueOnce(getMockCertification({ id: 'cert-ok' }))
        .mockRejectedValueOnce(new Error('Registry unavailable'));

      // Should not reject even though one cert fails
      await expect(service.verifyAllForCrew('crew-001', 'user-001')).resolves.not.toThrow();
    });
  });
});
