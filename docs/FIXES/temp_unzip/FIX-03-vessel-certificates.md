# FIX-03: Vessel Certificate Registry (SMC, DOC, Load Line, Radio License, MMSI)

## Regulatory Background

A Port State Control inspector boarding a Grand Bahama Ferry vessel will immediately check that the vessel holds **all statutory certificates** required under SOLAS, the ISM Code, and BMA national requirements. The current platform only tracks crew STCW certifications. It has no awareness of vessel-level certificates — which means a fully crewed vessel could be departed with expired or missing vessel certificates, exposing the operator to detention and fines.

The following certificates are mandatory for Bahamas-flagged commercial passenger ferry vessels:

| Certificate | Issuing Authority | Regulatory Basis | Validity |
|---|---|---|---|
| Safety Management Certificate (SMC) | BMA / Recognised Organisation | SOLAS Chapter IX / ISM Code | 5 years (annual audits) |
| Document of Compliance (DOC) | BMA / Recognised Organisation | SOLAS Chapter IX / ISM Code | 5 years (annual verification) |
| Passenger Ship Safety Certificate | BMA / Recognised Organisation | SOLAS Chapter I, Reg. 12 | 12 months |
| Load Line Certificate | BMA / Recognised Organisation | Load Lines Convention 1966 | 5 years |
| Radio License / Ship Station License | Bahamas Telecommunications Regulator | ITU Radio Regulations | Annual or multi-year |
| MMSI Number Registration | ITU / National Authority | ITU Radio Regulations | Permanent (must be current) |
| International Tonnage Certificate | BMA / Recognised Organisation | Tonnage Convention 1969 | Permanent unless modified |
| Continuous Synopsis Record (CSR) | BMA | SOLAS XI-1, Reg. 5 | Updated on change |
| ISPS International Ship Security Certificate (ISSC) | BMA / RSO | SOLAS XI-2 / ISPS Code | 5 years |
| Minimum Safe Manning Document (MSMD) | BMA | SOLAS V/14 / BMA MN-018 | Per vessel (see FIX-01) |

> **Note:** The DOC is issued to the **operating company**, not the vessel. The SMC is issued to each individual **vessel**. Both are required for ISM compliance.

---

## What Needs to Change

### 1. Prisma Schema

```prisma
// packages/database/prisma/schema.prisma

enum VesselCertificateType {
  SMC                        // Safety Management Certificate
  DOC                        // Document of Compliance (company-level)
  PASSENGER_SHIP_SAFETY      // Passenger Ship Safety Certificate
  LOAD_LINE                  // International Load Line Certificate
  RADIO_LICENSE              // Ship Station Radio License
  TONNAGE                    // International Tonnage Certificate
  CONTINUOUS_SYNOPSIS_RECORD // CSR (SOLAS XI-1/5)
  ISSC                       // International Ship Security Certificate
  MSMD                       // Minimum Safe Manning Document (see FIX-01)
  OTHER
}

enum VesselCertificateStatus {
  VALID
  EXPIRING_SOON   // Within 30 days
  CRITICAL        // Within 7 days
  EXPIRED
  PENDING_RENEWAL
  NOT_HELD        // Vessel does not hold this certificate — compliance gap
}

model VesselCertificate {
  id          String   @id @default(cuid())
  vesselId    String
  vessel      Vessel   @relation(fields: [vesselId], references: [id])

  type        VesselCertificateType
  referenceNumber String
  issuingAuthority String          // e.g. "Bahamas Maritime Authority"
  issuedBy         String?         // Name of surveyor or recognised organisation

  issueDate   DateTime
  expiryDate  DateTime?            // Null for permanent certificates (e.g. Tonnage)
  isPermanent Boolean  @default(false)

  status      VesselCertificateStatus @default(VALID)

  // Annual endorsement / verification dates (ISM SMC/DOC require annual verification)
  lastVerificationDate  DateTime?
  nextVerificationDue   DateTime?

  // For DOC: which vessel types are covered
  docVesselTypesCovered String?  // e.g. "Passenger Ships, High-Speed Craft"

  // MMSI number stored on Radio License record
  mmsiNumber  String?

  // Scanned certificate storage
  documentS3Key String?

  notes       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([vesselId, type])  // One of each type per vessel
  @@map("vessel_certificates")
}
```

---

### 2. Certificate Status Computation Service

```typescript
// apps/api/src/modules/vessels/vessel-certificate.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VesselCertificateStatus, VesselCertificateType } from '@prisma/client';

const EXPIRY_WARNING_DAYS = 30;
const EXPIRY_CRITICAL_DAYS = 7;

/**
 * Certificates that are mandatory for Bahamas-flagged passenger ferry vessels.
 * A PSC inspector will check all of these on boarding.
 * Regulatory basis: BMA Technical Procedures for Registration (TPR Rev.06),
 * SOLAS Chapters I, IV, IX, XI-1, XI-2, and BMA National Requirements v10.5
 */
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
}

@Injectable()
export class VesselCertificateService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute live certificate status for a vessel.
   * Status is computed at query time — not stored — to ensure accuracy.
   */
  async getVesselCertificateReport(vesselId: string): Promise<VesselCertificateComplianceReport> {
    const vessel = await this.prisma.vessel.findUniqueOrThrow({
      where: { id: vesselId },
      include: { certificates: true },
    });

    const now = new Date();
    const held = new Set(vessel.certificates.map((c) => c.type));

    const missingCertificates = MANDATORY_VESSEL_CERTIFICATES.filter((t) => !held.has(t));

    const expiredCertificates: CertificateStatusItem[] = [];
    const expiringCertificates: CertificateStatusItem[] = [];
    const validCertificates: CertificateStatusItem[] = [];

    for (const cert of vessel.certificates) {
      const item: CertificateStatusItem = {
        type: cert.type,
        referenceNumber: cert.referenceNumber,
        expiryDate: cert.expiryDate,
        daysUntilExpiry: null,
        status: cert.status,
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

    // ISM-specific: flag if annual verification is overdue (SMC/DOC)
    this.checkAnnualVerification(vessel.certificates, expiringCertificates);

    const overallStatus =
      missingCertificates.length > 0 || expiredCertificates.length > 0
        ? 'NON_COMPLIANT'
        : expiringCertificates.length > 0
          ? 'WARNING'
          : 'COMPLIANT';

    // Extract MMSI from Radio License record if available
    const radioLicense = vessel.certificates.find(
      (c) => c.type === VesselCertificateType.RADIO_LICENSE,
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
  }

  /**
   * SMC and DOC require annual intermediate/renewal verification under ISM Code.
   * Flag if the next verification date is within 30 days or overdue.
   */
  private checkAnnualVerification(
    certificates: any[],
    expiringOut: CertificateStatusItem[],
  ): void {
    const ismCerts = certificates.filter(
      (c) =>
        c.type === VesselCertificateType.SMC || c.type === VesselCertificateType.DOC,
    );

    const now = new Date();
    for (const cert of ismCerts) {
      if (!cert.nextVerificationDue) continue;
      const daysUntilVerification = Math.floor(
        (cert.nextVerificationDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilVerification <= 30) {
        expiringOut.push({
          type: cert.type,
          referenceNumber: cert.referenceNumber,
          expiryDate: cert.nextVerificationDue,
          daysUntilExpiry: daysUntilVerification,
          status:
            daysUntilVerification < 0
              ? VesselCertificateStatus.EXPIRED
              : VesselCertificateStatus.EXPIRING_SOON,
          issuingAuthority: cert.issuingAuthority,
          lastVerificationDate: cert.lastVerificationDate,
          nextVerificationDue: cert.nextVerificationDue,
        });
      }
    }
  }

  /**
   * Pre-departure compliance gate. Returns false if ANY mandatory certificate
   * is missing or expired. Used by the departure readiness checker.
   */
  async isVesselCertificateCompliant(vesselId: string): Promise<{
    cleared: boolean;
    blockers: string[];
  }> {
    const report = await this.getVesselCertificateReport(vesselId);
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
```

---

### 3. Frontend — Vessel Certificate Status Card

```tsx
// apps/web/src/components/vessels/VesselCertificateCard.tsx

import { Alert, Badge, Card, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { ExclamationCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Text } = Typography;

const CERT_LABELS: Record<string, string> = {
  SMC: 'Safety Management Certificate',
  DOC: 'Document of Compliance',
  PASSENGER_SHIP_SAFETY: 'Passenger Ship Safety Certificate',
  LOAD_LINE: 'Load Line Certificate',
  RADIO_LICENSE: 'Radio License / Ship Station',
  TONNAGE: 'Tonnage Certificate',
  ISSC: 'International Ship Security Certificate',
  MSMD: 'Minimum Safe Manning Document',
};

export function VesselCertificateCard({ report }: { report: any }) {
  const statusColor = {
    COMPLIANT: '#52c41a',
    WARNING: '#faad14',
    NON_COMPLIANT: '#ff4d4f',
  }[report.overallStatus];

  return (
    <Card
      title={
        <Space>
          <SafetyCertificateOutlined style={{ color: statusColor }} />
          <Text style={{ color: '#e6f7ff' }}>Vessel Certificates</Text>
          {report.mmsiNumber && (
            <Tag color="blue">MMSI: {report.mmsiNumber}</Tag>
          )}
        </Space>
      }
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${statusColor}40`,
      }}
    >
      {report.missingCertificates.length > 0 && (
        <Alert
          type="error"
          icon={<ExclamationCircleOutlined />}
          message={`${report.missingCertificates.length} mandatory certificate(s) not on file`}
          description={report.missingCertificates
            .map((t: string) => CERT_LABELS[t] || t)
            .join(', ')}
          style={{ marginBottom: 16 }}
          showIcon
        />
      )}

      <Table
        size="small"
        dataSource={[
          ...report.expiredCertificates,
          ...report.expiringCertificates,
          ...report.validCertificates,
        ]}
        pagination={false}
        rowKey="type"
        columns={[
          {
            title: 'Certificate',
            dataIndex: 'type',
            render: (t: string) => CERT_LABELS[t] || t,
          },
          {
            title: 'Reference',
            dataIndex: 'referenceNumber',
          },
          {
            title: 'Expiry',
            dataIndex: 'expiryDate',
            render: (d: string) => (d ? new Date(d).toLocaleDateString() : 'Permanent'),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (s: string, row: any) => {
              const colorMap: Record<string, string> = {
                VALID: 'success',
                EXPIRING_SOON: 'warning',
                CRITICAL: 'error',
                EXPIRED: 'error',
              };
              return (
                <Tooltip
                  title={
                    row.daysUntilExpiry !== null
                      ? `${row.daysUntilExpiry} days remaining`
                      : undefined
                  }
                >
                  <Badge status={colorMap[s] as any} text={s.replace('_', ' ')} />
                </Tooltip>
              );
            },
          },
          {
            title: 'Next Verification',
            dataIndex: 'nextVerificationDue',
            render: (d: string) => (d ? new Date(d).toLocaleDateString() : '—'),
          },
        ]}
      />
    </Card>
  );
}
```

---

## Migration Notes

1. **Seed existing vessels** with their certificate data. Every vessel in the database should have at minimum a `NOT_HELD` placeholder for each mandatory certificate type so compliance gaps are visible immediately.
2. **Integrate into departure gate**: `VesselCertificateService.isVesselCertificateCompliant()` must be called alongside the safe manning check before any departure is approved.
3. **DOC is company-level** — if the operator has a single DOC covering all passenger vessels, it can be linked to a `Company` entity rather than per-vessel, but it must still appear on every vessel's compliance summary.
4. **Annual ISM verification reminders** should feed into the existing SSE alert engine — 90 days, 30 days, and 7 days before the next verification due date.

## References
- SOLAS Chapter IX (ISM Code) — SMC and DOC requirements
- ISM Code, paragraphs 13-14 (certification and verification)
- BMA Marine Notice MN-046: ISM Code application to Bahamian ships
- SOLAS Chapter I, Regulation 12 (Passenger Ship Safety Certificate)
- Load Lines Convention 1966 (load line certificate)
- ITU Radio Regulations (MMSI, Ship Station License)
- SOLAS XI-2 / ISPS Code (ISSC)
- BMA Technical Procedures for Registration (TPR Rev.06)
- BMA National Requirements v10.5, Section 4.10 (ISM Code)
