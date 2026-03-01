import { Prisma, PrismaService } from '@gbferry/database';
import { Injectable } from '@nestjs/common';
import { validateCrewCompliance } from '../../lib/crew-validators';

// ─── Prisma payload types ───────────────────────────────────────────────────
type VesselWithCrew = Prisma.VesselGetPayload<{
  include: {
    crewMembers: {
      include: { certifications: true; medicalCertificate: true };
    };
  };
}>;

// ─── Response shapes ─────────────────────────────────────────────────────────
export interface MonthlyTrend {
  month: string; // e.g. "2026-02"
  inspectionCount: number;
  deficiencyCount: number;
  passRate: number; // 0-100
}

export interface VesselScore {
  vesselId: string;
  vesselName: string;
  imoNumber: string;
  score: number; // 0-100
  breakdown: {
    pscPassRate: number;
    certValidityRate: number;
    safeManningCompliance: number;
  };
}

export interface CertForecast {
  within30days: number;
  within60days: number;
  within90days: number;
  byVessel: Array<{
    vesselName: string;
    expiringSoon: number;
  }>;
}

@Injectable()
export class FleetAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 1. Compliance Trends ──────────────────────────────────────────────────
  async getComplianceTrends(months = 6): Promise<MonthlyTrend[]> {
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    const inspections = await this.prisma.inspection.findMany({
      where: {
        type: 'PORT_STATE_CONTROL',
        completedDate: { gte: fromDate },
      },
      include: { deficiencies: true },
      orderBy: { completedDate: 'asc' },
    });

    const buckets = new Map<string, { total: number; passed: number; deficiencies: number }>();

    for (const insp of inspections) {
      if (!insp.completedDate) continue;
      const key = insp.completedDate.toISOString().slice(0, 7); // "YYYY-MM"
      const bucket = buckets.get(key) ?? { total: 0, passed: 0, deficiencies: 0 };
      bucket.total++;
      if (insp.result === 'PASSED') bucket.passed++;
      bucket.deficiencies += insp.deficiencies.length;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries()).map(([month, b]) => ({
      month,
      inspectionCount: b.total,
      deficiencyCount: b.deficiencies,
      passRate: b.total > 0 ? Math.round((b.passed / b.total) * 100) : 100,
    }));
  }

  // ── 2. Vessel Performance Scores ─────────────────────────────────────────
  async getVesselPerformanceScores(): Promise<VesselScore[]> {
    const vessels = (await this.prisma.vessel.findMany({
      include: {
        crewMembers: {
          include: { certifications: true, medicalCertificate: true },
        },
      },
    })) as VesselWithCrew[];

    const pscHistory = await this.prisma.inspection.findMany({
      where: { type: 'PORT_STATE_CONTROL' },
      select: { vesselId: true, result: true },
    });

    // Build per-vessel PSC pass rate map
    const pscByVessel = new Map<string, { total: number; passed: number }>();
    for (const insp of pscHistory) {
      const entry = pscByVessel.get(insp.vesselId) ?? { total: 0, passed: 0 };
      entry.total++;
      if (insp.result === 'PASSED') entry.passed++;
      pscByVessel.set(insp.vesselId, entry);
    }

    const now = new Date();

    return vessels.map((vessel) => {
      // PSC pass rate
      const psc = pscByVessel.get(vessel.id);
      const pscPassRate = psc ? Math.round((psc.passed / psc.total) * 100) : 100;

      // Certificate validity rate
      const allCerts = vessel.crewMembers.flatMap((c) => c.certifications);
      const validCerts = allCerts.filter((c) => c.expiryDate > now);
      const certValidityRate =
        allCerts.length > 0 ? Math.round((validCerts.length / allCerts.length) * 100) : 100;

      // Safe manning compliance
      const crew = vessel.crewMembers.map((c) => ({
        id: c.id,
        name: `${c.familyName} ${c.givenNames}`,
        role: c.role,
        hasMedical: !!c.medicalCertificate,
        medicalExpiryDate: c.medicalCertificate?.expiryDate.toISOString(),
        certifications: c.certifications.map((cert) => ({
          type: cert.type,
          expiryDate: cert.expiryDate.toISOString(),
        })),
      }));
      const manning = validateCrewCompliance(crew);
      const safeManningCompliance = manning.compliant ? 100 : 0;

      // Composite score: 40% PSC, 40% certs, 20% manning
      const score = Math.round(
        pscPassRate * 0.4 + certValidityRate * 0.4 + safeManningCompliance * 0.2
      );

      return {
        vesselId: vessel.id,
        vesselName: vessel.name,
        imoNumber: vessel.imoNumber,
        score,
        breakdown: { pscPassRate, certValidityRate, safeManningCompliance },
      };
    });
  }

  // ── 3. Certification Forecast ─────────────────────────────────────────────
  async getCertificationForecast(): Promise<CertForecast> {
    const vessels = (await this.prisma.vessel.findMany({
      include: {
        crewMembers: { include: { certifications: true } },
      },
    })) as VesselWithCrew[];

    const now = new Date();
    const d = (days: number) => new Date(now.getTime() + days * 86_400_000);

    let within30 = 0;
    let within60 = 0;
    let within90 = 0;
    const byVessel: CertForecast['byVessel'] = [];

    for (const vessel of vessels) {
      const allCerts = vessel.crewMembers.flatMap((c) => c.certifications);
      let vesselSoon = 0;

      for (const cert of allCerts) {
        if (cert.expiryDate > now && cert.expiryDate <= d(90)) {
          within90++;
          vesselSoon++;
          if (cert.expiryDate <= d(60)) {
            within60++;
          }
          if (cert.expiryDate <= d(30)) {
            within30++;
          }
        }
      }

      byVessel.push({ vesselName: vessel.name, expiringSoon: vesselSoon });
    }

    byVessel.sort((a, b) => b.expiringSoon - a.expiringSoon);

    return { within30days: within30, within60days: within60, within90days: within90, byVessel };
  }
}
