import { validateCrewCompliance, validateSafeManningRequirement } from '@/lib/crew-validators';
import { PrismaService } from '@gbferry/database';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

/**
 * Compliance Adapter Service
 *
 * Jurisdiction-specific translation layer that converts internal
 * data models to regulatory export formats (CSV, JSON).
 *
 * Supports:
 * - Bahamas Maritime Authority (BMA)
 * - Jamaica (Phase 2)
 * - Barbados (Phase 2)
 */

interface ExportResult {
  data: Buffer;
  filename: string;
  contentType: string;
}

// Jurisdiction-specific field mappings
const JURISDICTION_CONFIGS: Record<
  string,
  {
    name: string;
    crewFields: string[];
    dateFormat: string;
    nameFormat: 'uppercase' | 'titlecase';
  }
> = {
  bahamas: {
    name: 'Bahamas Maritime Authority',
    crewFields: [
      'familyName',
      'givenNames',
      'nationality',
      'dateOfBirth',
      'gender',
      'role',
      'passportCountry',
      'passportExpiry',
      'certificationStatus',
    ],
    dateFormat: 'YYYY-MM-DD',
    nameFormat: 'uppercase',
  },
  jamaica: {
    name: 'Maritime Authority of Jamaica',
    crewFields: [],
    dateFormat: 'DD/MM/YYYY',
    nameFormat: 'titlecase',
  },
  barbados: {
    name: 'Barbados Port Authority',
    crewFields: [],
    dateFormat: 'DD-MM-YYYY',
    nameFormat: 'uppercase',
  },
};

@Injectable()
export class ComplianceAdapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Export crew compliance pack for a vessel.
   * Includes: vessel info, crew roster, certifications, safe manning status.
   */
  async exportCrewCompliance(
    vesselId: string,
    format: string,
    jurisdiction: string = 'bahamas',
    userId?: string
  ): Promise<ExportResult> {
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      include: {
        crewMembers: {
          where: { deletedAt: null, status: 'ACTIVE' },
          include: {
            certifications: { where: { status: 'VALID' } },
            medicalCertificate: true,
          },
        },
        safeManningReqs: {
          include: { requirements: true },
          orderBy: { issueDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!vessel) {
      throw new NotFoundException(`Vessel ${vesselId} not found`);
    }

    const config = JURISDICTION_CONFIGS[jurisdiction] || JURISDICTION_CONFIGS['bahamas'];

    // Validate crew compliance
    const crewForValidation = vessel.crewMembers.map((c) => ({
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
    const complianceResult = validateCrewCompliance(crewForValidation);

    // Validate safe manning
    const safeManningReqs = vessel.safeManningReqs[0]?.requirements?.map((r) => ({
      role: r.role,
      minimumCount: r.minimumCount,
    }));
    const safeManningResult = validateSafeManningRequirement(
      crewForValidation.map((c) => ({ id: c.id, name: c.name, role: c.role })),
      { requirements: safeManningReqs, vesselGrossTonnage: Number(vessel.grossTonnage) }
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `crew-compliance-${vessel.name.replace(/\s+/g, '_')}-${timestamp}`;

    let data: Buffer;
    let contentType: string;

    if (format === 'csv') {
      data = this.generateCSV(vessel, config);
      contentType = 'text/csv';
    } else {
      // Default: structured JSON
      data = Buffer.from(
        JSON.stringify(
          {
            exportMetadata: {
              jurisdiction: config.name,
              exportedAt: new Date().toISOString(),
              vesselName: vessel.name,
              vesselIMO: vessel.imoNumber,
            },
            crewRoster: vessel.crewMembers.map((c) => ({
              familyName:
                config.nameFormat === 'uppercase' ? c.familyName.toUpperCase() : c.familyName,
              givenNames:
                config.nameFormat === 'uppercase' ? c.givenNames.toUpperCase() : c.givenNames,
              nationality: c.nationality,
              dateOfBirth: c.dateOfBirth.toISOString().split('T')[0],
              gender: c.gender,
              role: c.role,
              passportCountry: c.passportCountry,
              passportExpiry: c.passportExpiry.toISOString().split('T')[0],
              certCount: c.certifications.length,
              hasMedical: !!c.medicalCertificate,
            })),
            compliance: {
              overallCompliant: complianceResult.compliant && safeManningResult.compliant,
              certificationErrors: complianceResult.errors.length,
              certificationWarnings: complianceResult.warnings.length,
              safeManningCompliant: safeManningResult.compliant,
              safeManningRequired: safeManningResult.required,
              safeManningActual: safeManningResult.actualByRole,
            },
          },
          null,
          2
        )
      );
      contentType = 'application/json';
    }

    // Audit log the export
    await this.auditService.log({
      action: 'EXPORT',
      entityType: 'crew_compliance',
      entityId: vesselId,
      userId,
      details: {
        vesselName: vessel.name,
        format,
        jurisdiction,
        crewCount: vessel.crewMembers.length,
        compliant: complianceResult.compliant && safeManningResult.compliant,
      },
      compliance: 'ISO 27001 A.8.15 - Crew compliance export logged for regulatory traceability',
    });

    return {
      data,
      filename: `${filename}.${format === 'csv' ? 'csv' : 'json'}`,
      contentType,
    };
  }

  /**
   * Generate a CSV export of the crew roster with compliance data.
   */
  private generateCSV(vessel: any, config: (typeof JURISDICTION_CONFIGS)[string]): Buffer {
    const headers = [
      'Family Name',
      'Given Names',
      'Nationality',
      'Date of Birth',
      'Gender',
      'Role',
      'Passport Country',
      'Passport Expiry',
      'Valid Certifications',
      'Has Medical',
    ];

    const rows = vessel.crewMembers.map((c: any) => [
      config.nameFormat === 'uppercase' ? c.familyName.toUpperCase() : c.familyName,
      config.nameFormat === 'uppercase' ? c.givenNames.toUpperCase() : c.givenNames,
      c.nationality,
      c.dateOfBirth.toISOString().split('T')[0],
      c.gender,
      c.role,
      c.passportCountry,
      c.passportExpiry.toISOString().split('T')[0],
      c.certifications.length.toString(),
      c.medicalCertificate ? 'YES' : 'NO',
    ]);

    const csvContent = [
      `# Crew Compliance Export - ${vessel.name} (${vessel.imoNumber})`,
      `# Jurisdiction: ${config.name}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      headers.join(','),
      ...rows.map((row: string[]) => row.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * List available jurisdictions with their configuration.
   */
  getAvailableJurisdictions(): Array<{ code: string; name: string }> {
    return Object.entries(JURISDICTION_CONFIGS).map(([code, config]) => ({
      code,
      name: config.name,
    }));
  }
}
