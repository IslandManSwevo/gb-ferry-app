import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../modules/audit/audit.service';
import { I418Service } from '../modules/cbp/i418.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { EncryptionService } from '../modules/security/encryption.service';

describe('I418Service', () => {
  let service: I418Service;

  const mockPrisma = {
    i418Submission: {
      findUniqueOrThrow: jest.fn(),
    },
  };

  const mockEncryption = {
    decrypt: jest.fn((val) => Promise.resolve(val.replace('ENC_', ''))),
  };

  const mockAudit = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I418Service,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<I418Service>(I418Service);
  });

  describe('validateI418Completeness', () => {
    it('should flag missing visa type for non-US crew', async () => {
      mockPrisma.i418Submission.findUniqueOrThrow.mockResolvedValue({
        vessel: { imoNumber: '1234567' },
        voyageNumber: 'V001',
        portOfEntry: 'FLL',
        lastForeignPort: 'NAS',
        crewEntries: [
          {
            rank: 'MASTER',
            nationality: 'BSH', // Bahamas (Non-US)
            passportNumber: 'ENC_P123',
            passportExpiry: new Date(),
            dateOfBirth: new Date(),
            visaType: null,
            alienRegistrationNumber: null,
          },
        ],
      });

      const result = await service.validateI418Completeness('sub_123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'MASTER (BSH): non-US crew must have visa type or alien registration number.'
      );
    });

    it('should require IMO number before submission', async () => {
      mockPrisma.i418Submission.findUniqueOrThrow.mockResolvedValue({
        vessel: { imoNumber: null },
        voyageNumber: 'V001',
        portOfEntry: 'FLL',
        lastForeignPort: 'NAS',
        crewEntries: [
          {
            rank: 'MASTER',
            nationality: 'USA',
            passportNumber: 'ENC_P123',
            passportExpiry: new Date(),
            dateOfBirth: new Date(),
          },
        ],
      });

      const result = await service.validateI418Completeness('sub_123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Vessel IMO number is required for I-418 submission.');
    });
  });

  describe('departure reconciliation', () => {
    it('should include joinedAfterArrival crew in additions', async () => {
      mockPrisma.i418Submission.findUniqueOrThrow.mockResolvedValue({
        portOfEntry: 'FLL',
        cbpReceiptNumber: 'REC123',
        departureDate: new Date(),
        nextForeignPort: 'NAS',
        crewEntries: [
          {
            joinedAfterArrival: true,
            rank: 'MASTER',
            crewMember: { firstName: 'John', lastName: 'Doe' },
          },
          {
            joinedAfterArrival: false,
            rank: 'CHIEF_OFFICER',
            crewMember: { firstName: 'Jane', lastName: 'Smith' },
          },
        ],
      });

      const result = await service.buildDepartureReconciliation('sub_123');
      expect(result.crewAdditions).toHaveLength(1);
      expect(result.crewAdditions[0].lastName).toBe('Doe');
    });
  });
});
