import { CertificationStatus, PrismaService } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { CrewService } from '../crew/crew.service';
import { PscRiskResponse, RiskBreakdownItem, RiskLevel } from './psc-risk.dto';

@Injectable()
export class PscRiskService {
  private readonly logger = new Logger(PscRiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crewService: CrewService
  ) {}

  async calculateRiskScore(vesselId: string): Promise<PscRiskResponse> {
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        crewMembers: {
          include: {
            certifications: true,
          },
        },
        inspections: {
          include: {
            deficiencies: true,
          },
        },
      },
    });

    if (!vessel) {
      throw new Error(`Vessel with ID ${vesselId} not found`);
    }

    const breakdown: RiskBreakdownItem[] = [];
    let totalScore = 0;

    // 1. Certification Health (Max 50pts)
    const certRisk = await this.calculateCertRisk(vessel);
    totalScore += certRisk.points;
    breakdown.push(certRisk);

    // 2. Safe Manning Compliance (Max 30pts)
    const manningRisk = await this.calculateManningRisk(vessel);
    totalScore += manningRisk.points;
    breakdown.push(manningRisk);

    // 3. Inspection History (Max 20pts)
    const historyRisk = await this.calculateHistoryRisk(vessel);
    totalScore += historyRisk.points;
    breakdown.push(historyRisk);

    // 4. Vessel Age (Max 5pts)
    const ageRisk = this.calculateAgeRisk(vessel);
    totalScore += ageRisk.points;
    breakdown.push(ageRisk);

    // Cap at 100
    totalScore = Math.min(totalScore, 100);

    return {
      vesselId,
      score: totalScore,
      level: this.mapScoreToLevel(totalScore),
      breakdown,
      calculatedAt: new Date(),
    };
  }

  private async calculateCertRisk(vessel: any): Promise<RiskBreakdownItem> {
    let points = 0;
    let description = 'All certifications are valid.';

    const criticalExpiries = vessel.crewMembers.flatMap((cm: any) =>
      cm.certifications.filter((c: any) => c.status === CertificationStatus.EXPIRED)
    );

    const approachingExpiries = vessel.crewMembers.flatMap((cm: any) =>
      cm.certifications.filter((c: any) => {
        if (c.status !== CertificationStatus.VALID) return false;
        const daysToExpiry =
          (new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToExpiry < 30;
      })
    );

    if (criticalExpiries.length > 0) {
      points = 50;
      description = `Critical: ${criticalExpiries.length} expired certifications found on active crew.`;
    } else if (approachingExpiries.length > 0) {
      const nearCritical = approachingExpiries.filter((c: any) => {
        const daysToExpiry =
          (new Date(c.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToExpiry < 7;
      });
      points = nearCritical.length > 0 ? 30 : 15;
      description = `Warning: ${approachingExpiries.length} certifications expiring within 30 days.`;
    }

    return { category: 'Certifications', points, description };
  }

  private async calculateManningRisk(vessel: any): Promise<RiskBreakdownItem> {
    try {
      const manningStatus = await this.crewService.getRoster(vessel.id);
      if (!manningStatus.compliant) {
        return {
          category: 'Safe Manning',
          points: 30,
          description: 'Vessel does not meet BMA R106 Safe Manning requirements.',
        };
      }
    } catch (e: any) {
      this.logger.warn(`Failed to validate manning for ${vessel.id}: ${e.message}`);
    }

    return {
      category: 'Safe Manning',
      points: 0,
      description: 'Manning is compliant with R106.',
    };
  }

  private async calculateHistoryRisk(vessel: any): Promise<RiskBreakdownItem> {
    const openDeficiencies = vessel.inspections.flatMap((i: any) =>
      i.deficiencies.filter((d: any) => !d.resolved)
    );

    if (openDeficiencies.length > 0) {
      return {
        category: 'Inspection History',
        points: 20,
        description: `${openDeficiencies.length} open deficiencies found from previous PSC/Flag inspections.`,
      };
    }

    const recentFail = vessel.inspections.some((i: any) => {
      const monthsSince =
        (Date.now() - new Date(i.completedDate || i.scheduledDate).getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      return monthsSince < 6 && i.result === 'FAILED';
    });

    if (recentFail) {
      return {
        category: 'Inspection History',
        points: 15,
        description: 'Failed inspection within the last 6 months.',
      };
    }

    return {
      category: 'Inspection History',
      points: 0,
      description: 'No recent failures or open deficiencies.',
    };
  }

  private calculateAgeRisk(vessel: any): RiskBreakdownItem {
    const age = new Date().getFullYear() - vessel.yearBuilt;
    if (age > 25) {
      return {
        category: 'Vessel Age',
        points: 5,
        description: `Vessel age (${age} years) increases inspection probability.`,
      };
    }
    return {
      category: 'Vessel Age',
      points: 0,
      description: 'Vessel age is not a significant risk factor.',
    };
  }

  private mapScoreToLevel(score: number): RiskLevel {
    if (score >= 70) return RiskLevel.CRITICAL;
    if (score >= 40) return RiskLevel.HIGH;
    if (score >= 20) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }
}
