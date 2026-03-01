import { Inspection, Prisma, PrismaService } from '@gbferry/database';
import { RecordInspection } from '@gbferry/dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateCrewCompliance } from '../../lib/crew-validators';
import { AuditService } from '../audit/audit.service';

// Define focused types using Prisma payloads to eliminate 'any'
type VesselWithCrewAndCerts = Prisma.VesselGetPayload<{
  include: {
    crewMembers: {
      include: {
        certifications: true;
        medicalCertificate: true;
      };
    };
  };
}>;

type AuditLogWithUser = Prisma.AuditLogGetPayload<{ include: { user: true } }>;
type InspectionWithDeficiencies = Prisma.InspectionGetPayload<{ include: { deficiencies: true } }>;

export interface ReportFilters {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ComplianceDashboard {
  summary: {
    totalVessels: number;
    compliantVessels: number;
    totalCrew: number;
    expiringCertifications: number;
    upcomingInspections: number;
    nonCompliantAlertsCount: number;
  };
  recentActivity: ActivityLog[];
  alerts: ComplianceAlert[];
  metrics: {
    safeManningCompliance: number;
    certificateValidityRate: number;
    auditTrailCoverage: number;
  };
}

export interface ActivityLog {
  timestamp: Date;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: Record<string, any>;
}

export interface ComplianceAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  title: string;
  description: string;
  affectedEntity: {
    type: string;
    id: string;
    name: string;
  };
  detectedAt: Date;
  resolvedAt?: Date;
}

@Injectable()
export class ComplianceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async getDashboard(userId?: string): Promise<ComplianceDashboard> {
    /**
     * Optimized Dashboard Fetch
     * Fixes N+1 issue by using recursive includes for vessel -> crew -> certifications
     */
    const vessels = (await this.prisma.vessel.findMany({
      include: {
        crewMembers: {
          include: {
            certifications: {
              where: { status: 'VALID' },
            },
            medicalCertificate: true,
          },
        },
      },
    })) as VesselWithCrewAndCerts[];

    // Calculate safe manning compliance and validity rates
    let compliantVesselsCount = 0;
    let totalValidCerts = 0;
    let totalCerts = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let expiringCount = 0;

    vessels.forEach((vessel) => {
      const crewForValidation = vessel.crewMembers.map((crew) => {
        // Collect cert stats
        totalCerts += crew.certifications.length;
        totalValidCerts += crew.certifications.filter((c) => c.expiryDate > now).length;

        // Count expiring certs
        expiringCount += crew.certifications.filter(
          (c) => c.expiryDate <= thirtyDaysFromNow && c.expiryDate > now
        ).length;

        return {
          id: crew.id,
          name: `${crew.familyName} ${crew.givenNames}`,
          role: crew.role,
          hasMedical: !!crew.medicalCertificate,
          medicalExpiryDate: crew.medicalCertificate?.expiryDate.toISOString(),
          certifications: crew.certifications.map((cert) => ({
            type: cert.type,
            expiryDate: cert.expiryDate.toISOString(),
          })),
        };
      });

      const validation = validateCrewCompliance(crewForValidation);
      if (validation.compliant) compliantVesselsCount++;
    });

    const totalCrew = await this.prisma.crewMember.count({
      where: { status: 'ACTIVE' },
    });

    // Generate compliance alerts using the already fetched data
    const alerts = await this.generateComplianceAlerts(vessels);

    // Fetch recent audit log
    const recentActivity = await this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    // Log dashboard access
    await this.auditService.log({
      action: 'COMPLIANCE_DASHBOARD_VIEW',
      entityType: 'compliance',
      userId,
      details: {
        totalVessels: vessels.length,
        compliantVessels: compliantVesselsCount,
      },
      compliance: 'Dashboard access logged for audit trail',
    });

    const certificateValidityRate = totalCerts > 0 ? (totalValidCerts / totalCerts) * 100 : 100;

    return {
      summary: {
        totalVessels: vessels.length,
        compliantVessels: compliantVesselsCount,
        expiringCertifications: expiringCount,
        totalCrew,
        upcomingInspections: 0,
        nonCompliantAlertsCount: alerts.filter((a) => a.severity === 'critical').length,
      },
      recentActivity: recentActivity.map((log) => ({
        timestamp: log.timestamp,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        userId: log.userId,
        details: (log.metadata as Record<string, any>) || {},
      })),
      alerts,
      metrics: {
        safeManningCompliance:
          vessels.length > 0 ? (compliantVesselsCount / vessels.length) * 100 : 100,
        certificateValidityRate,
        auditTrailCoverage: 100,
      },
    };
  }

  async getReports(filters: ReportFilters, userId?: string): Promise<any> {
    if (filters.dateFrom && filters.dateTo) {
      const from = new Date(filters.dateFrom);
      const to = new Date(filters.dateTo);

      if (from > to) {
        throw new BadRequestException('dateFrom must be before dateTo');
      }

      if (to.getTime() - from.getTime() > 365 * 24 * 60 * 60 * 1000) {
        throw new BadRequestException('Report period cannot exceed 365 days');
      }
    }

    if (filters.type === 'psc_deficiency_trends') {
      return this.getPscDeficiencyTrends(filters);
    }

    if (filters.type === 'fleet_compliance_snapshot') {
      return this.getFleetComplianceSnapshot(filters);
    }

    // Default: Fetch audit logs for reporting
    const reports = (await this.prisma.auditLog.findMany({
      where: {
        ...(filters.dateFrom && {
          timestamp: { gte: new Date(filters.dateFrom) },
        }),
        ...(filters.dateTo && {
          timestamp: { lte: new Date(filters.dateTo) },
        }),
      },
      include: { user: true },
      orderBy: { timestamp: 'desc' },
    })) as AuditLogWithUser[];

    // Log report generation
    await this.auditService.log({
      action: 'COMPLIANCE_REPORT_GENERATED',
      entityType: 'compliance',
      userId,
      details: { filters, recordsIncluded: reports.length },
      compliance: 'Report generation logged per ISO 27001 A.8.15',
    });

    return {
      data: reports.map((log) => ({
        ...log,
        metadata: (log.metadata as Record<string, any>) || {},
      })),
      total: reports.length,
      filters,
      reportDetails: {
        generatedAt: new Date().toISOString(),
        completeness: 100,
        signatureAvailable: true,
      },
    };
  }

  private async getPscDeficiencyTrends(filters: ReportFilters): Promise<any> {
    const inspections = (await this.prisma.inspection.findMany({
      where: {
        type: 'PORT_STATE_CONTROL',
        completedDate: {
          ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
          ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
        },
      },
      include: { deficiencies: true },
    })) as InspectionWithDeficiencies[];

    const deficiencyCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = { major: 0, minor: 0, observation: 0 };

    inspections.forEach((insp) => {
      insp.deficiencies.forEach((def) => {
        deficiencyCounts[def.code] = (deficiencyCounts[def.code] || 0) + 1;
        severityCounts[def.severity] = (severityCounts[def.severity] || 0) + 1;
      });
    });

    return {
      reportType: 'PSC Deficiency Trends',
      period: { from: filters.dateFrom, to: filters.dateTo },
      summary: {
        totalInspections: inspections.length,
        inspectionsWithDeficiencies: inspections.filter((i) => i.deficiencies.length > 0).length,
        totalDeficiencies: Object.values(deficiencyCounts).reduce((a, b) => a + b, 0),
      },
      trends: {
        byCode: deficiencyCounts,
        bySeverity: severityCounts,
      },
      compliance: 'BMA / PSC Historical Analysis',
    };
  }

  private async getFleetComplianceSnapshot(filters: ReportFilters): Promise<any> {
    const snapshotDate = filters.dateTo ? new Date(filters.dateTo) : new Date();

    const vessels = (await this.prisma.vessel.findMany({
      include: {
        crewMembers: {
          include: {
            certifications: {
              where: { status: 'VALID', expiryDate: { gt: snapshotDate } },
            },
            medicalCertificate: true,
          },
        },
      },
    })) as VesselWithCrewAndCerts[];

    const vesselCompliance = vessels.map((vessel) => {
      const crewForValidation = vessel.crewMembers.map((crew) => ({
        id: crew.id,
        name: `${crew.familyName} ${crew.givenNames}`,
        role: crew.role,
        hasMedical: !!crew.medicalCertificate,
        medicalExpiryDate: crew.medicalCertificate?.expiryDate.toISOString(),
        certifications: crew.certifications.map((cert) => ({
          type: cert.type,
          expiryDate: cert.expiryDate.toISOString(),
        })),
      }));

      const validation = validateCrewCompliance(crewForValidation);
      return {
        vesselName: vessel.name,
        vesselImo: vessel.imoNumber,
        isCompliant: validation.compliant,
        deficiencies: validation.errors.map((e) => e.message),
        crewCount: vessel.crewMembers.length,
      };
    });

    return {
      reportType: 'Fleet Compliance Snapshot',
      snapshotDate,
      vessels: vesselCompliance,
      summary: {
        totalVessels: vessels.length,
        compliantVessels: vesselCompliance.filter((v) => v.isCompliant).length,
        overallComplianceRate:
          vessels.length > 0
            ? (vesselCompliance.filter((v) => v.isCompliant).length / vessels.length) * 100
            : 100,
      },
    };
  }

  async findAllInspections(filters: { vesselId?: string; status?: string }): Promise<Inspection[]> {
    return this.prisma.inspection.findMany({
      where: {
        ...(filters.vesselId && { vesselId: filters.vesselId }),
        ...(filters.status && { status: filters.status as any }),
      },
      include: {
        vessel: { select: { name: true, imoNumber: true } },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async recordInspection(inspectionDto: RecordInspection, userId: string): Promise<Inspection> {
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: inspectionDto.vesselId },
    });

    if (!vessel) {
      throw new NotFoundException('Vessel not found');
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        vessel: { connect: { id: inspectionDto.vesselId } },
        type: inspectionDto.type,
        inspectingAuthority: inspectionDto.inspectingAuthority,
        inspectorName: inspectionDto.inspectorName,
        scheduledDate: new Date(inspectionDto.scheduledDate),
        completedDate: new Date(),
        status: 'COMPLETED',
        result: 'PASSED',
        notes: inspectionDto.notes,
        createdBy: { connect: { id: userId } },
      },
    });

    await this.auditService.log({
      action: 'INSPECTION_RECORD',
      entityId: inspection.id,
      entityType: 'inspection',
      userId,
      details: {
        vesselId: inspectionDto.vesselId,
        authority: inspectionDto.inspectingAuthority,
      },
      compliance: 'ISO 27001 A.8.15 - Immutable inspection audit record',
    });

    return inspection;
  }

  private async generateComplianceAlerts(
    vessels: VesselWithCrewAndCerts[]
  ): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();

    for (const vessel of vessels) {
      // 1. Safe Manning Checks
      const crewForValidation = vessel.crewMembers.map((crew) => ({
        id: crew.id,
        name: `${crew.familyName} ${crew.givenNames}`,
        role: crew.role,
        hasMedical: !!crew.medicalCertificate,
        medicalExpiryDate: crew.medicalCertificate?.expiryDate.toISOString(),
        certifications: crew.certifications.map((cert) => ({
          type: cert.type,
          expiryDate: cert.expiryDate.toISOString(),
        })),
      }));

      const validation = validateCrewCompliance(crewForValidation);
      if (!validation.compliant) {
        alerts.push({
          id: `alert-safe-manning-${vessel.id}`,
          severity: 'critical',
          type: 'safe_manning_violation',
          title: `BMA R106 Safe Manning Violation: ${vessel.name}`,
          description: validation.errors.map((e) => e.message).join('; '),
          affectedEntity: {
            type: 'vessel',
            id: vessel.id,
            name: vessel.name,
          },
          detectedAt: now,
        });
      }

      // 2. Individual Crew Certification Expiry Checks
      for (const crew of vessel.crewMembers) {
        for (const cert of crew.certifications) {
          const daysUntilExpiry = Math.floor(
            (cert.expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );

          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            alerts.push({
              id: `alert-cert-expiry-${cert.id}`,
              severity: daysUntilExpiry < 7 ? 'critical' : 'warning',
              type: 'certificate_expiry',
              title: `${cert.type} Certificate Expiring - ${daysUntilExpiry} Days`,
              description: `Crew member ${crew.familyName} ${crew.givenNames} has ${cert.type} expiring in ${daysUntilExpiry} days`,
              affectedEntity: {
                type: 'crew',
                id: crew.id,
                name: `${crew.familyName} ${crew.givenNames}`,
              },
              detectedAt: now,
            });
          }
        }
      }
    }

    return alerts;
  }
}
