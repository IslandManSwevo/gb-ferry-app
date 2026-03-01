import { CertificationStatus, PrismaService } from '@gbferry/database';
import { Test, TestingModule } from '@nestjs/testing';
import { CrewService } from '../crew/crew.service';
import { RiskLevel } from './psc-risk.dto';
import { PscRiskService } from './psc-risk.service';

describe('PscRiskService', () => {
  let service: PscRiskService;
  let prisma: PrismaService;
  let crewService: CrewService;

  const mockVessel = {
    id: 'vessel-1',
    name: 'Thunderbolt',
    yearBuilt: 2010,
    crewMembers: [
      {
        id: 'crew-1',
        certifications: [
          {
            status: CertificationStatus.VALID,
            expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ],
    inspections: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PscRiskService,
        {
          provide: PrismaService,
          useValue: {
            vessel: {
              findUnique: jest.fn().mockResolvedValue(mockVessel),
            },
          },
        },
        {
          provide: CrewService,
          useValue: {
            getRoster: jest.fn().mockResolvedValue({ compliant: true }),
          },
        },
      ],
    }).compile();

    service = module.get<PscRiskService>(PscRiskService);
    prisma = module.get<PrismaService>(PrismaService);
    crewService = module.get<CrewService>(CrewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate LOW risk for a perfect vessel', async () => {
    const result = await service.calculateRiskScore('vessel-1');
    expect(result.score).toBe(0);
    expect(result.level).toBe(RiskLevel.LOW);
  });

  it('should calculate CRITICAL risk for expired certifications', async () => {
    const highRiskVessel = {
      ...mockVessel,
      crewMembers: [
        {
          id: 'crew-1',
          certifications: [{ status: CertificationStatus.EXPIRED, expiryDate: new Date() }],
        },
      ],
    };
    jest.spyOn(prisma.vessel, 'findUnique').mockResolvedValue(highRiskVessel as any);

    const result = await service.calculateRiskScore('vessel-1');
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.breakdown.find((b) => b.category === 'Certifications')?.points).toBe(50);
  });

  it('should calculate HIGH risk for non-compliant manning', async () => {
    jest.spyOn(crewService, 'getRoster').mockResolvedValue({ compliant: false } as any);

    const result = await service.calculateRiskScore('vessel-1');
    expect(result.score).toBe(30);
    expect(result.breakdown.find((b) => b.category === 'Safe Manning')?.points).toBe(30);
  });

  it('should include vessel age in scoring', async () => {
    const oldVessel = { ...mockVessel, yearBuilt: 1990 }; // 36 years old in 2026
    jest.spyOn(prisma.vessel, 'findUnique').mockResolvedValue(oldVessel as any);

    const result = await service.calculateRiskScore('vessel-1');
    expect(result.breakdown.find((b) => b.category === 'Vessel Age')?.points).toBe(5);
  });

  it('should flag risk for open deficiencies', async () => {
    const vesselWithDeficiencies = {
      ...mockVessel,
      inspections: [
        {
          deficiencies: [{ resolved: false }],
          scheduledDate: new Date(),
        },
      ],
    };
    jest.spyOn(prisma.vessel, 'findUnique').mockResolvedValue(vesselWithDeficiencies as any);

    const result = await service.calculateRiskScore('vessel-1');
    expect(result.breakdown.find((b) => b.category === 'Inspection History')?.points).toBe(20);
  });
});
