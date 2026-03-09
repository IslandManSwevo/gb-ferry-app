import { Prisma, PrismaService } from '@gbferry/database';
import { Injectable } from '@nestjs/common';
import { validateCrewCompliance } from '../../lib/crew-validators';
import { AuditService } from '../audit/audit.service';
import { VesselCertificateService } from '../vessels/vessel-certificate.service';
import { SafeManningEngine } from './safe-manning.engine';

// Define focused types using Prisma payloads to eliminate 'any'
type VesselWithCrewAndCerts = Prisma.VesselGetPayload<{
  include: {
    crewMembers: {
      include: {
        certifications: true;
        medicalCertificate: true;
      };
    };
    msmd: true;
    certificates: true;
  };
}>;

export interface ComplianceDashboard {
  summary: {
    totalVessels: number;
    compliantVessels: number;
    totalCrew: number;
    expiringCertifications: number;
    blockingIssues: number;
    criticalIssues: number;
  };
  vessels: VesselReadinessInfo[];
  alerts: ComplianceAlert[];
  metrics: {
    safeManningCompliance: number;
    certificateValidityRate: number;
    auditTrailCoverage: number;
  };
}

export interface VesselReadinessInfo {
  id: string;
  name: string;
  imoNumber: string;
  isCompliant: boolean;
  safeManningCompliant: boolean;
  certificatesCompliant: boolean;
  priority: 'BLOCKING' | 'CRITICAL' | 'WARNING' | 'OK';
}

export interface ComplianceAlert {
  id: string;
  severity: 'BLOCKING' | 'CRITICAL' | 'WARNING' | 'INFO';
  type: string;
  title: string;
  description: string;
  affectedEntity: {
    type: string;
    id: string;
    name: string;
  };
  detectedAt: Date;
}

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private safeManningEngine: SafeManningEngine,
    private vesselCertificateService: VesselCertificateService
  ) {}

  async getDashboard(userId?: string): Promise<ComplianceDashboard> {
    const vessels = (await this.prisma.vessel.findMany({
      include: {
        crewMembers: {
          include: {
            certifications: { where: { status: 'VALID' } },
            medicalCertificate: true,
          },
        },
        msmd: true,
        certificates: true,
      },
    })) as VesselWithCrewAndCerts[];

    const vesselReadiness: VesselReadinessInfo[] = [];
    const allAlerts: ComplianceAlert[] = [];

    let totalValidCerts = 0;
    let totalCerts = 0;
    const now = new Date();
    const expiringCertsCount = await this.prisma.vesselCertificate.count({
      where: {
        expiryDate: {
          gte: now,
          lt: new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()),
        },
        status: 'VALID',
      },
    });

    // FIX-12: Parallelize per-vessel work to eliminate 2N sequential awaits (N+1 fix)
    const vesselValidations = await Promise.all(
      vessels.map(async (vessel) => {
        const [manningResult, certReport] = await Promise.all([
          this.safeManningEngine.validateVesselManning(vessel.id),
          this.vesselCertificateService.getVesselCertificateReport(vessel.id),
        ]);
        return { vessel, manningResult, certReport };
      })
    );

    for (const { vessel, manningResult, certReport } of vesselValidations) {
      // 3. Validate Crew Compliance (Defensive name joining)
      const crewForValidation = vessel.crewMembers.map((c) => {
        totalCerts += c.certifications.length;
        totalValidCerts += c.certifications.filter((cert) => cert.expiryDate > now).length;

        // FIX-10: Defensive name construction (filter out null/undefined/empty)
        const fullName = [c.familyName, c.givenNames].filter(Boolean).join(' ') || 'Unknown Crew';

        return {
          id: c.id,
          name: fullName,
          role: c.role,
          hasMedical: !!c.medicalCertificate,
          medicalExpiryDate: c.medicalCertificate?.expiryDate.toISOString(),
          certifications: c.certifications.map((cert) => ({
            type: cert.type,
            expiryDate: cert.expiryDate.toISOString(),
          })),
        };
      });
      const crewValidation = validateCrewCompliance(crewForValidation);

      // Map engine results to dashboard alerts
      if (!manningResult.compliant) {
        allAlerts.push({
          id: `manning-${vessel.id}`,
          severity: manningResult.msmdExpired ? 'BLOCKING' : 'CRITICAL',
          type: 'SAFE_MANNING',
          title: `Safe Manning Deficiency: ${vessel.name}`,
          description: manningResult.deficiencies
            .map((d) => `${d.role}: ${d.assigned}/${d.required}`)
            .join(', '),
          affectedEntity: { type: 'vessel', id: vessel.id, name: vessel.name },
          detectedAt: now,
        });
      }

      certReport.expiredCertificates.forEach((cert) => {
        allAlerts.push({
          id: `cert-expired-${cert.type}-${vessel.id}`,
          severity: 'BLOCKING',
          type: 'VESSEL_CERTIFICATE',
          title: `Expired Certificate: ${cert.type} (${vessel.name})`,
          description: `Certificate ${cert.referenceNumber} expired on ${cert.expiryDate?.toLocaleDateString()}`,
          affectedEntity: { type: 'vessel', id: vessel.id, name: vessel.name },
          detectedAt: now,
        });
      });

      const isCompliant =
        manningResult.compliant &&
        certReport.overallStatus === 'COMPLIANT' &&
        crewValidation.compliant;

      // FIX-11: Refined priority logic including WARNING branch
      let priority: 'BLOCKING' | 'CRITICAL' | 'WARNING' | 'OK';
      if (!manningResult.compliant || certReport.overallStatus === 'NON_COMPLIANT') {
        priority = 'BLOCKING';
      } else if (certReport.overallStatus === 'WARNING' && crewValidation.compliant) {
        priority = 'WARNING';
      } else if (certReport.overallStatus === 'WARNING' || !crewValidation.compliant) {
        priority = 'CRITICAL';
      } else {
        priority = 'OK';
      }

      vesselReadiness.push({
        id: vessel.id,
        name: vessel.name,
        imoNumber: vessel.imoNumber,
        isCompliant,
        safeManningCompliant: manningResult.compliant,
        certificatesCompliant: certReport.overallStatus === 'COMPLIANT',
        priority,
      });
    }

    const totalCrew = await this.prisma.crewMember.count({ where: { status: 'ACTIVE' } });

    // FIX-09: Correct audit action for compliance dashboard view
    await this.auditService.log({
      action: 'COMPLIANCE_DASHBOARD_VIEW',
      entityType: 'compliance_dashboard',
      userId,
      details: {
        vesselCount: vessels.length,
        blockingAlerts: allAlerts.filter((a) => a.severity === 'BLOCKING').length,
      },
    });

    return {
      summary: {
        totalVessels: vessels.length,
        compliantVessels: vesselReadiness.filter((v) => v.isCompliant).length,
        totalCrew,
        expiringCertifications: expiringCertsCount,
        blockingIssues: allAlerts.filter((a) => a.severity === 'BLOCKING').length,
        criticalIssues: allAlerts.filter((a) => a.severity === 'CRITICAL').length,
      },
      vessels: vesselReadiness,
      alerts: allAlerts.sort((a, b) => {
        const order = { BLOCKING: 0, CRITICAL: 1, WARNING: 2, INFO: 3 };
        return order[a.severity] - order[b.severity];
      }),
      metrics: {
        safeManningCompliance:
          vessels.length > 0
            ? (vesselReadiness.filter((v) => v.safeManningCompliant).length / vessels.length) * 100
            : 100,
        certificateValidityRate: totalCerts > 0 ? (totalValidCerts / totalCerts) * 100 : 100,
        auditTrailCoverage: 100,
      },
    };
  }
}
