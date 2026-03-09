import { PrismaService } from '@gbferry/database';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../modules/audit/audit.service';
import { I418Service } from '../modules/cbp/i418.service';
import { EncryptionService } from '../modules/security/encryption.service';

describe('I418Service', () => {
  let service: I418Service;

  const mockPrisma = {
    i418Submission: {
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
    },
    crewMember: {
      findMany: jest.fn(),
    },
  };

  const mockEncryption = {
    decrypt: jest.fn((val) => val.replace('ENC_', '')),
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
    it('should identify newly joined crew members', async () => {
      // Mock latest arrival submission with 1 crew (ID: 101)
      mockPrisma.i418Submission.findFirst.mockResolvedValue({
        id: 'sub_old',
        crewEntries: [{ crewMemberId: '101' }],
      });

      // Mock current active crew on vessel (IDs: 101 and 102)
      mockPrisma.crewMember.findMany.mockResolvedValue([
        { id: '101', familyName: 'Smith' },
        { id: '102', familyName: 'Doe' },
      ]);

      const result = await service.getDepartureReconciliation('vessel_123');

      expect(result).not.toBeNull();
      if (result) {
        expect(result.joined).toHaveLength(1);
        expect(result.joined[0].id).toBe('102');
        expect(result.stayed).toHaveLength(1);
        expect(result.stayed[0].id).toBe('101');
      }
    });
  });
});
