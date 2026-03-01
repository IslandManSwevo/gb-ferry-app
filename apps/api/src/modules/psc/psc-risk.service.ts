import { CertificationStatus, PrismaService, Prisma } from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';
import { CrewService } from '../crew/crew.service';
import { PscRiskResponse, RiskBreakdownItem, RiskLevel } from './psc-risk.dto';

/**
 * Type-safe payload for vessel data with required risk-scoring relations.
 */
type VesselWithCrewAndInspections = Prisma.VesselGetPayload<{
  include: {
    crewMembers: {
      include: {
        certifications: true;
      };
    };
    inspections: {
      include: {
        deficiencies: true;
      };
    };
  };
}>;

/**
 * Centrally managed risk scoring weights and thresholds.
 */
const RISK_CONFIG = {
  CERTIFICATIONS: {
    EXPIRED: 50,
    EXPIRING_7_DAYS: 30,
    EXPIRING_30_DAYS: 15,
  },
  MANNING: {
    NON_COMPLIANT: 30,
    DATA_INCOMPLETE: 10,
  },
  HISTORY: {
    OPEN_DEFICIENCIES: 20,
    RECENT_FAIL_6_MONTHS: 15,
  },
  VESSEL_AGE: {
    THRESHOLD_YEARS: 25,
    PENALTY: 5,
  },
};

@Injectable()
export class PscRiskService {
  private readonly logger = new Logger(PscRiskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crewService: CrewService
  ) {}

  /**
   * Calculates a predictive PSC risk score for a vessel.
   * @param vesselId Unique identifier of the vessel.
   * @param referenceDate Optional date for point-in-time calculation (defaults to now).
   */
  async calculateRiskScore(vesselId: string, referenceDate: Date = new Date()): Promise<PscRiskResponse> {
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
    }) as VesselWithCrewAndInspections | null;

    if (!vessel) {
      throw new Error(`Vessel with ID ${vesselId} not found`);
    }

    const breakdown: RiskBreakdownItem[] = [];
    let totalScore = 0;

    // 1. Certification Health
    const certRisk = this.calculateCertRisk(vessel, referenceDate);
    totalScore += certRisk.points;
    breakdown.push(certRisk);

    // 2. Safe Manning Compliance
    const manningRisk = await this.calculateManningRisk(vessel);
    totalScore += manningRisk.points;
    breakdown.push(manningRisk);

    // 3. Inspection History
    const historyRisk = this.calculateHistoryRisk(vessel, referenceDate);
    totalScore += historyRisk.points;
    breakdown.push(historyRisk);

    // 4. Vessel Age
    const ageRisk = this.calculateAgeRisk(vessel, referenceDate);
    totalScore += ageRisk.points;
    breakdown.push(ageRisk);

    // Cap at 100
    totalScore = Math.min(totalScore, 100);

    return {
      vesselId,
      score: totalScore,
      level: this.mapScoreToLevel(totalScore),
      breakdown,
      calculatedAt: referenceDate,
    };
  }

  private calculateCertRisk(vessel: VesselWithCrewAndInspections, refDate: Date): RiskBreakdownItem {
    let points = 0;
    let description = 'All certifications are valid.';

    const criticalExpiries = vessel.crewMembers.flatMap((cm) =>
      cm.certifications.filter((c) => c.status === CertificationStatus.EXPIRED || new Date(c.expiryDate) < refDate)
    );

    const approachingExpiries = vessel.crewMembers.flatMap((cm) =>
      cm.certifications.filter((c) => {
        if (c.status !== CertificationStatus.VALID && new Date(c.expiryDate) >= refDate) return false;
        const daysToExpiry =
          (new Date(c.expiryDate).getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysToExpiry < 30 && daysToExpiry >= 0;
      })
    );

    if (criticalExpiries.length > 0) {
      points = RISK_CONFIG.CERTIFICATIONS.EXPIRED;
      description = `Critical: ${criticalExpiries.length} expired certifications found on active crew.`;
    } else if (approachingExpiries.length > 0) {
      const nearCritical = approachingExpiries.filter((c) => {
        const daysToExpiry =
          (new Date(c.expiryDate).getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysToExpiry < 7;
      });
      points = nearCritical.length > 0 
        ? RISK_CONFIG.CERTIFICATIONS.EXPIRING_7_DAYS 
        : RISK_CONFIG.CERTIFICATIONS.EXPIRING_30_DAYS;
      description = `Warning: ${approachingExpiries.length} certifications expiring within 30 days.`;
    }

    return { category: 'Certifications', points, description };
  }

  private async calculateManningRisk(vessel: VesselWithCrewAndInspections): Promise<RiskBreakdownItem> {
    try {
      const manningStatus = await this.crewService.getRoster(vessel.id);
      if (!manningStatus.compliant) {
        return {
          category: 'Safe Manning',
          points: RISK_CONFIG.MANNING.NON_COMPLIANT,
          description: 'Vessel does not meet BMA R106 Safe Manning requirements.',
        };
      }
    } catch (e: any) {
      this.logger.warn(`Failed to validate manning for ${vessel.id}: ${e.message}`);
      return {
        category: 'Safe Manning',
        points: RISK_CONFIG.MANNING.DATA_INCOMPLETE,
        description: 'Manning validation could not be completed due to incomplete data.',
      };
    }

    return {
      category: 'Safe Manning',
      points: 0,
      description: 'Manning is compliant with R106.',
    };
  }

  private calculateHistoryRisk(vessel: VesselWithCrewAndInspections, refDate: Date): RiskBreakdownItem {
    const openDeficiencies = vessel.inspections.flatMap((i) =>
      i.deficiencies.filter((d) => !d.resolved)
    );

    if (openDeficiencies.length > 0) {
      return {
        category: 'Inspection History',
        points: RISK_CONFIG.HISTORY.OPEN_DEFICIENCIES,
        description: `${openDeficiencies.length} open deficiencies found from previous PSC/Flag inspections.`,
      };
    }

    const recentFail = vessel.inspections.some((i) => {
      const completionDate = i.completedDate ? new Date(i.completedDate) : new Date(i.scheduledDate);
      const monthsSince =
        (refDate.getTime() - completionDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30);
      return monthsSince >= 0 && monthsSince < 6 && i.result === 'FAILED';
    });

    if (recentFail) {
      return {
        category: 'Inspection History',
        points: RISK_CONFIG.HISTORY.RECENT_FAIL_6_MONTHS,
        description: 'Failed inspection within the last 6 months.',
      };
    }

    return {
      category: 'Inspection History',
      points: 0,
      description: 'No recent failures or open deficiencies.',
    };
  }

  private calculateAgeRisk(vessel: VesselWithCrewAndInspections, refDate: Date): RiskBreakdownItem {
    const age = refDate.getFullYear() - vessel.yearBuilt;
    if (age > RISK_CONFIG.VESSEL_AGE.THRESHOLD_YEARS) {
      return {
        category: 'Vessel Age',
        points: RISK_CONFIG.VESSEL_AGE.PENALTY,
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
