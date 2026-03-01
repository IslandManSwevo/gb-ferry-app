/**
 * audit.service.spec.ts
 *
 * Unit tests for AuditService focused on the log() SYSTEM user resolution path.
 *
 * Skills applied:
 * - nestjs-expert: plain object mocks, no TestingModule needed
 * - testing-patterns: factory functions, one behavior per test
 */

import { AuditService } from './audit.service';

// ─── Factories ────────────────────────────────────────────────────────────────

const SYSTEM_USER = { id: 'system-audit-user', email: 'system@gbferry.internal', role: 'system' };
const REAL_USER = { id: 'user-001', email: 'admin@gbferry.com', role: 'admin' };

const getMockPrisma = () => ({
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'log-001' }),
  },
  user: {
    // resolveSystemUser calls findUnique({ where: { keycloakId: 'SYSTEM_AUDIT_USER' } })
    findUnique: jest.fn().mockResolvedValue(null),
    // When not found, it calls user.create
    create: jest.fn().mockResolvedValue(SYSTEM_USER),
  },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  let service: AuditService;
  let prisma: ReturnType<typeof getMockPrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = getMockPrisma();
    service = new AuditService(prisma as any);
  });

  describe('log()', () => {
    it('creates an audit entry with the provided userId when user exists', async () => {
      // When userId is provided and user.findUnique finds the user
      prisma.user.findUnique.mockResolvedValue(REAL_USER);

      await service.log({
        action: 'CREW_CREATE',
        entityType: 'crew',
        entityId: 'crew-001',
        userId: 'user-001',
        details: { test: true },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-001',
            action: 'CREW_CREATE',
            entityType: 'crew',
            entityId: 'crew-001',
          }),
        })
      );
    });

    it('resolves SYSTEM user via findUnique + create when userId is not provided', async () => {
      // No userId → resolveSystemUser → findUnique returns null → create
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(SYSTEM_USER);

      await service.log({
        action: 'COMPLIANCE_REPORT_GENERATED',
        entityType: 'compliance',
        details: {},
      });

      // Checked for existing SYSTEM user
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { keycloakId: 'SYSTEM_AUDIT_USER' } })
      );
      // Created when not found
      expect(prisma.user.create).toHaveBeenCalled();
      // Audit log created with system user id
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'system-audit-user' }),
        })
      );
    });

    it('reuses existing SYSTEM user when one already exists', async () => {
      // resolveSystemUser → findUnique returns existing system user
      prisma.user.findUnique.mockResolvedValue(SYSTEM_USER);

      await service.log({
        action: 'DATA_EXPORT',
        entityType: 'vessel',
        // no userId
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'system-audit-user' }),
        })
      );
    });

    it('includes compliance metadata in the log when provided', async () => {
      prisma.user.findUnique.mockResolvedValue(REAL_USER);

      await service.log({
        action: 'CBP_APIS_SUBMITTED',
        entityType: 'cbpSubmission',
        entityId: 'sub-001',
        userId: 'user-001',
        compliance: 'ISO 27001 A.8.15',
      });

      // compliance is merged into the metadata field
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({ compliance: 'ISO 27001 A.8.15' }),
          }),
        })
      );
    });

    it('does not throw when prisma fails — swallows error gracefully', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('DB offline'));

      await expect(
        service.log({ action: 'TEST', entityType: 'test', userId: 'user-001' })
      ).resolves.not.toThrow();
    });
  });
});
