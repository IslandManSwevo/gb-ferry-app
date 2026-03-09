import {
  PrismaService,
  VesselCertificate,
  VesselCertificateStatus,
  VesselCertificateType,
} from '@gbferry/database';
import { Injectable, Logger } from '@nestjs/common';

function isValidCertificateType(type: string): type is VesselCertificateType {
  return Object.values(VesselCertificateType).includes(type as VesselCertificateType);
}

const EXPIRY_WARNING_DAYS = 30;
const EXPIRY_CRITICAL_DAYS = 7;

export const MANDATORY_VESSEL_CERTIFICATES: VesselCertificateType[] = [
  VesselCertificateType.SMC,
  VesselCertificateType.DOC,
  VesselCertificateType.PASSENGER_SHIP_SAFETY,
  VesselCertificateType.LOAD_LINE,
  VesselCertificateType.RADIO_LICENSE,
  VesselCertificateType.TONNAGE,
  VesselCertificateType.ISSC,
  VesselCertificateType.MSMD,
];

export interface VesselCertificateComplianceReport {
  vesselId: string;
  vesselName: string;
  overallStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  missingCertificates: VesselCertificateType[];
  expiredCertificates: CertificateStatusItem[];
  expiringCertificates: CertificateStatusItem[];
  validCertificates: CertificateStatusItem[];
  mmsiNumber?: string;
}

export interface CertificateStatusItem {
  type: VesselCertificateType;
  referenceNumber: string;
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
  status: VesselCertificateStatus;
  issuingAuthority: string;
  lastVerificationDate: Date | null;
  nextVerificationDue: Date | null;
  daysUntilVerification?: number | null;
  verificationOverdue?: boolean;
}

@Injectable()
export class VesselCertificateService {
  private readonly logger = new Logger(VesselCertificateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getVesselCertificateReport(vesselId: string): Promise<VesselCertificateComplianceReport> {
    try {
      const vessel = await this.prisma.vessel.findUniqueOrThrow({
        where: { id: vesselId },
        include: { certificates: true },
      });

      const now = new Date();
      const held = new Set(
        vessel.certificates
          .filter((c) => isValidCertificateType(c.type))
          .map((c) => c.type as VesselCertificateType)
      );

      const missingCertificates = MANDATORY_VESSEL_CERTIFICATES.filter((t) => !held.has(t));

      const expiredCertificates: CertificateStatusItem[] = [];
      const expiringCertificates: CertificateStatusItem[] = [];
      const validCertificates: CertificateStatusItem[] = [];

      for (const cert of vessel.certificates) {
        if (!isValidCertificateType(cert.type)) {
          this.logger.warn(`Vessel ${vesselId} has invalid certificate type: ${cert.type}`);
          continue;
        }

        const item: CertificateStatusItem = {
          type: cert.type as VesselCertificateType,
          referenceNumber: cert.referenceNumber,
          expiryDate: cert.expiryDate,
          daysUntilExpiry: null,
          status: cert.status as VesselCertificateStatus,
          issuingAuthority: cert.issuingAuthority,
          lastVerificationDate: cert.lastVerificationDate,
          nextVerificationDue: cert.nextVerificationDue,
        };

        if (cert.isPermanent || !cert.expiryDate) {
          item.status = VesselCertificateStatus.VALID;
          validCertificates.push(item);
          continue;
        }

        const msUntilExpiry = cert.expiryDate.getTime() - now.getTime();
        const daysUntilExpiry = Math.floor(msUntilExpiry / (1000 * 60 * 60 * 24));
        item.daysUntilExpiry = daysUntilExpiry;

        if (daysUntilExpiry < 0) {
          item.status = VesselCertificateStatus.EXPIRED;
          expiredCertificates.push(item);
        } else if (daysUntilExpiry <= EXPIRY_CRITICAL_DAYS) {
          item.status = VesselCertificateStatus.CRITICAL;
          expiringCertificates.push(item);
        } else if (daysUntilExpiry <= EXPIRY_WARNING_DAYS) {
          item.status = VesselCertificateStatus.EXPIRING_SOON;
          expiringCertificates.push(item);
        } else {
          item.status = VesselCertificateStatus.VALID;
          validCertificates.push(item);
        }
      }

      // FIX-22: Check annual verification without polluting expiry metrics
      this.checkAnnualVerification(vessel.certificates, expiringCertificates);

      const overallStatus =
        missingCertificates.length > 0 || expiredCertificates.length > 0
          ? 'NON_COMPLIANT'
          : expiringCertificates.length > 0
            ? 'WARNING'
            : 'COMPLIANT';

      const radioLicense = vessel.certificates.find(
        (c: VesselCertificate) => c.type === VesselCertificateType.RADIO_LICENSE
      );

      return {
        vesselId,
        vesselName: vessel.name,
        overallStatus,
        missingCertificates,
        expiredCertificates,
        expiringCertificates,
        validCertificates,
        mmsiNumber: radioLicense?.mmsiNumber ?? undefined,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch certificate report for vessel ${vesselId}: ${error.message}`
      );
      return {
        vesselId,
        vesselName: 'ERROR_FETCHING_VESSEL',
        overallStatus: 'NON_COMPLIANT',
        missingCertificates: [],
        expiredCertificates: [],
        expiringCertificates: [],
        validCertificates: [],
      };
    }
  }

  private checkAnnualVerification(
    certificates: VesselCertificate[],
    expiringOut: CertificateStatusItem[]
  ): void {
    const ismCerts = certificates.filter(
      (c: VesselCertificate) =>
        c.type === VesselCertificateType.SMC || c.type === VesselCertificateType.DOC
    );

    const now = new Date();
    for (const cert of ismCerts) {
      if (!cert.nextVerificationDue) continue;

      // FIX-22: Prevent duplicates if the cert is already in expiringOut due to expiry
      if (expiringOut.some((item) => item.type === cert.type)) continue;

      const msUntilVerification = cert.nextVerificationDue.getTime() - now.getTime();
      const daysUntilVerification = Math.floor(msUntilVerification / (1000 * 60 * 60 * 24));

      if (daysUntilVerification <= 30) {
        expiringOut.push({
          type: cert.type as VesselCertificateType,
          referenceNumber: cert.referenceNumber,
          expiryDate: cert.expiryDate, // Keep original expiry
          daysUntilExpiry: null, // Don't repurpose this
          status:
            daysUntilVerification < 0
              ? VesselCertificateStatus.VERIFICATION_OVERDUE
              : VesselCertificateStatus.EXPIRING_SOON,
          issuingAuthority: cert.issuingAuthority,
          lastVerificationDate: cert.lastVerificationDate,
          nextVerificationDue: cert.nextVerificationDue,
          daysUntilVerification,
          verificationOverdue: daysUntilVerification < 0,
        });
      }
    }
  }

  async isVesselCertificateCompliant(vesselId: string): Promise<{
    cleared: boolean;
    blockers: string[];
  }> {
    const report = await this.getVesselCertificateReport(vesselId);
    if (report.vesselName === 'ERROR_FETCHING_VESSEL') {
      return { cleared: false, blockers: ['System error retrieving vessel certificates'] };
    }
    const blockers: string[] = [];

    for (const missing of report.missingCertificates) {
      blockers.push(`Missing mandatory certificate: ${missing}`);
    }
    for (const expired of report.expiredCertificates) {
      blockers.push(`Expired certificate: ${expired.type} (${expired.referenceNumber})`);
    }

    return { cleared: blockers.length === 0, blockers };
  }
}
