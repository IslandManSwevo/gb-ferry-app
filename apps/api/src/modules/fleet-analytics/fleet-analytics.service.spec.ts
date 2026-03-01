import { PrismaService } from '@gbferry/database';
import { Test, TestingModule } from '@nestjs/testing';
import { FleetAnalyticsService } from './fleet-analytics.service';

// ─── Mock data ──────────────────────────────────────────────────────────────
const now = new Date();
const future60 = new Date(now.getTime() + 60 * 86_400_000);
const future20 = new Date(now.getTime() + 20 * 86_400_000);
const past = new Date(now.getTime() - 10 * 86_400_000);

const mockVessel = {
  id: 'v1',
  name: 'GB Sunrise',
  imoNumber: '1234567',
  crewMembers: [
    {
      id: 'c1',
      familyName: 'Smith',
      givenNames: 'John',
      role: 'MASTER',
      medicalCertificate: { expiryDate: future60 },
      certifications: [
        { id: 'cert1', type: 'STCW_COC', expiryDate: future60, status: 'VALID' },
        { id: 'cert2', type: 'MEDICAL', expiryDate: future20, status: 'VALID' },
      ],
    },
  ],
};

const mockPscInspection = {
  id: 'insp1',
  type: 'PORT_STATE_CONTROL',
  result: 'PASSED',
  vesselId: 'v1',
  completedDate: new Date('2026-02-15'),
  deficiencies: [],
};

const mockPrisma = {
  vessel: { findMany: jest.fn() },
  inspection: { findMany: jest.fn() },
};

describe('FleetAnalyticsService', () => {
  let service: FleetAnalyticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [FleetAnalyticsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FleetAnalyticsService>(FleetAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getComplianceTrends', () => {
    it('should return monthly trends grouped by month', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([mockPscInspection]);

      const result = await service.getComplianceTrends(6);

      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2026-02');
      expect(result[0].passRate).toBe(100);
      expect(result[0].inspectionCount).toBe(1);
      expect(result[0].deficiencyCount).toBe(0);
    });

    it('should return empty array when no PSC inspections exist', async () => {
      mockPrisma.inspection.findMany.mockResolvedValue([]);
      const result = await service.getComplianceTrends(6);
      expect(result).toEqual([]);
    });
  });

  describe('getVesselPerformanceScores', () => {
    it('should compute a score between 0 and 100 for each vessel', async () => {
      mockPrisma.vessel.findMany.mockResolvedValue([mockVessel]);
      mockPrisma.inspection.findMany.mockResolvedValue([mockPscInspection]);

      const result = await service.getVesselPerformanceScores();

      expect(result).toHaveLength(1);
      const score = result[0];
      expect(score.vesselId).toBe('v1');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.breakdown.pscPassRate).toBe(100);
    });
  });

  describe('getCertificationForecast', () => {
    it('should correctly bucket certs expiring within 30/60/90 days', async () => {
      mockPrisma.vessel.findMany.mockResolvedValue([mockVessel]);

      const result = await service.getCertificationForecast();

      // cert2 expires in 20 days → within30, within60, within90
      // cert1 expires in 60 days → within60, within90
      expect(result.within30days).toBe(1); // cert2 only
      expect(result.within60days).toBe(2); // cert1 + cert2
      expect(result.within90days).toBe(2); // same
      expect(result.byVessel).toHaveLength(1);
      expect(result.byVessel[0].vesselName).toBe('GB Sunrise');
      expect(result.byVessel[0].expiringSoon).toBe(2);
    });

    it('should not count already-expired certs', async () => {
      const expiredVessel = {
        ...mockVessel,
        crewMembers: [
          {
            ...mockVessel.crewMembers[0],
            certifications: [{ id: 'old', type: 'STCW_COC', expiryDate: past, status: 'EXPIRED' }],
          },
        ],
      };
      mockPrisma.vessel.findMany.mockResolvedValue([expiredVessel]);

      const result = await service.getCertificationForecast();
      expect(result.within90days).toBe(0);
    });
  });
});
