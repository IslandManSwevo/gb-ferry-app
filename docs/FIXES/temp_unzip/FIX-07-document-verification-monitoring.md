# FIX-07: Document Verification Queue, Renewal Workflow & Real Certificate Monitoring

## Overview

Three interconnected systems need to be built properly:

1. **Verification Queue** — AI extraction produces drafts; a human compliance officer must confirm before a certificate counts toward compliance gates.
2. **Renewal Workflow** — When a new cert is uploaded for an existing cert type, the platform links old and new, archives the expired one, and maintains a clean audit chain.
3. **Real Monitoring Job** — Replace the demo-mode cron with a proper daily scheduler that queries real data and emits structured, actionable alerts.
4. **Document Viewer** — Pre-signed S3 URL generation so compliance officers can retrieve and view scanned originals in-platform.

---

## Part 1: Verification Queue

### The Problem

After AI extraction, `document-upload.service.ts` immediately creates the certification as `status: VALID`. This means an AI misread (wrong expiry year, wrong cert type) goes directly into compliance calculations. The `PENDING_VERIFICATION` status already exists in the `CertificationStatus` enum — it just isn't being used.

### 1a. Schema — Add Verification Fields

The `Certification` model already has `documentVerified`, `verifiedAt`, and `verifiedById`. Add the AI extraction confidence score and extracted raw data so the verifier can see what the AI found vs. what they should confirm:

```prisma
// packages/database/prisma/schema.prisma
// Add to the Certification model:

model Certification {
  // ... existing fields ...

  // AI Extraction Metadata
  aiExtractedData       Json?     // Raw fields the AI found before human confirmation
  aiConfidenceScore     Decimal?  // 0.0 - 1.0 — low confidence surfaces prominently in queue
  aiExtractionWarnings  String[]  // e.g. ["Expiry date ambiguous", "Cert number not found"]

  // Renewal chain
  replacedById          String?   @unique  // Points to the NEW cert that replaced this one
  replacesId            String?            // Points to the OLD cert this one replaced
  replacedBy            Certification?     @relation("CertRenewal", fields: [replacedById], references: [id])
  replaces              Certification?     @relation("CertRenewal")

  // Rejection tracking (when a verifier rejects AI extraction)
  rejectedAt            DateTime?
  rejectedById          String?
  rejectionReason       String?

  @@index([status])
  @@index([crewId, type])  // For renewal lookup
}
```

Run: `pnpm db:push` after adding these fields.

---

### 1b. Document Upload Service — Save as PENDING_VERIFICATION

```typescript
// apps/api/src/modules/documents/document-upload.service.ts

private async handleCertification(
  uploadDto: DocumentUploadDto,
  metadata: DocumentMetadata,
  storageKey: string,
  expiryDate: Date | null,
  userId: string
): Promise<Certification> {
  // Check for existing cert of same type on this crew member (renewal detection)
  const existingCert = await this.prisma.certification.findFirst({
    where: {
      crewId: uploadDto.entityId,
      type: (metadata.detectedType as any) || uploadDto.documentType || 'STCW_COC',
      status: { in: ['VALID', 'EXPIRING', 'PENDING_VERIFICATION'] },
      replacedById: null, // Not already superseded
    },
    orderBy: { createdAt: 'desc' },
  });

  // Confidence warnings for the verifier
  const aiWarnings: string[] = [];
  if (metadata.confidence < 0.5) {
    aiWarnings.push('Low confidence extraction — verify all fields carefully.');
  }
  if (!metadata.extractedExpiryDate) {
    aiWarnings.push('Expiry date was not found in the document — manual entry required.');
  }
  if (!metadata.certificateNumber) {
    aiWarnings.push('Certificate number was not found — verify against original document.');
  }

  // Always create as PENDING_VERIFICATION — never bypass the human check
  const cert = await this.prisma.certification.create({
    data: {
      crewId: uploadDto.entityId,
      type: (metadata.detectedType as any) || uploadDto.documentType || 'STCW_COC',
      certificateNumber: metadata.certificateNumber || 'PENDING',
      issuingAuthority: metadata.issuingAuthority || '',
      issuingCountry: 'BS',
      issueDate: new Date(),
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      documentUrl: storageKey,
      status: 'PENDING_VERIFICATION',  // ← NEVER set to VALID here
      createdById: userId,
      documentVerified: false,
      aiExtractedData: metadata as any,
      aiConfidenceScore: metadata.confidence,
      aiExtractionWarnings: aiWarnings,
      // Link to previous cert if renewal detected
      replacesId: existingCert?.id ?? null,
      notes: existingCert
        ? `Renewal of cert ${existingCert.id} (${existingCert.certificateNumber})`
        : null,
    },
  });

  await this.auditService.log({
    action: 'CERTIFICATION_CREATE',
    entityId: cert.id,
    entityType: 'certification',
    userId,
    details: {
      confidence: metadata.confidence,
      certNumber: metadata.certificateNumber,
      pendingVerification: true,
      isRenewal: !!existingCert,
      replacesId: existingCert?.id,
    },
  });

  return cert;
}
```

---

### 1c. Verification Service

```typescript
// apps/api/src/modules/crew/certifications.service.ts

/**
 * Fetch all certifications awaiting human verification.
 * These are displayed in the compliance officer's verification queue.
 */
async getPendingVerificationQueue(): Promise<CertificationQueueItem[]> {
  const pending = await this.prisma.certification.findMany({
    where: { status: 'PENDING_VERIFICATION' },
    include: {
      crew: {
        select: {
          id: true,
          familyName: true,
          givenNames: true,
          role: true,
          vesselId: true,
          vessel: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { aiConfidenceScore: 'asc' },  // Low-confidence items surface first
      { createdAt: 'asc' },
    ],
  });

  return pending.map((cert) => ({
    certificationId: cert.id,
    crewMemberId: cert.crewId,
    crewName: `${cert.crew.familyName}, ${cert.crew.givenNames}`,
    crewRole: cert.crew.role,
    vesselName: cert.crew.vessel?.name ?? 'Unassigned',
    certType: cert.type,
    // AI-extracted values shown to verifier for confirmation
    aiExtractedCertNumber: (cert.aiExtractedData as any)?.certificateNumber ?? null,
    aiExtractedExpiry: (cert.aiExtractedData as any)?.extractedExpiryDate ?? null,
    aiExtractedAuthority: (cert.aiExtractedData as any)?.issuingAuthority ?? null,
    aiConfidenceScore: Number(cert.aiConfidenceScore ?? 0),
    aiWarnings: cert.aiExtractionWarnings ?? [],
    documentS3Key: cert.documentUrl,
    isRenewal: !!cert.replacesId,
    replacesId: cert.replacesId,
    uploadedAt: cert.createdAt,
  }));
}

/**
 * Compliance officer confirms the extracted data, optionally correcting any fields.
 * Transitions: PENDING_VERIFICATION → VALID
 * If this is a renewal, archives the previous certificate.
 */
async verifyCertification(
  certId: string,
  verifiedById: string,
  corrections?: {
    certificateNumber?: string;
    expiryDate?: string;
    issuingAuthority?: string;
    issuingCountry?: string;
  }
): Promise<Certification> {
  const cert = await this.prisma.certification.findUniqueOrThrow({
    where: { id: certId },
  });

  if (cert.status !== 'PENDING_VERIFICATION') {
    throw new BadRequestException(
      `Certification ${certId} is not pending verification (current status: ${cert.status}).`
    );
  }

  // Apply any corrections the compliance officer made
  const updateData: Prisma.CertificationUpdateInput = {
    status: 'VALID',
    documentVerified: true,
    verifiedAt: new Date(),
    verifiedById,
    ...(corrections?.certificateNumber && { certificateNumber: corrections.certificateNumber }),
    ...(corrections?.expiryDate && { expiryDate: new Date(corrections.expiryDate) }),
    ...(corrections?.issuingAuthority && { issuingAuthority: corrections.issuingAuthority }),
    ...(corrections?.issuingCountry && { issuingCountry: corrections.issuingCountry }),
  };

  const verified = await this.prisma.certification.update({
    where: { id: certId },
    data: updateData,
  });

  // Renewal: archive the superseded certificate
  if (cert.replacesId) {
    await this.prisma.certification.update({
      where: { id: cert.replacesId },
      data: {
        status: 'EXPIRED',
        replacedById: certId,
        notes: `Superseded by cert ${certId} on ${new Date().toISOString()}`,
      },
    });

    await this.auditService.log({
      action: 'CERTIFICATION_UPDATE',
      entityId: cert.replacesId,
      entityType: 'certification',
      userId: verifiedById,
      details: { reason: 'SUPERSEDED_BY_RENEWAL', newCertId: certId },
    });
  }

  await this.auditService.log({
    action: 'CERTIFICATION_VERIFY',
    entityId: certId,
    entityType: 'certification',
    userId: verifiedById,
    details: {
      correctionsApplied: !!corrections,
      wasRenewal: !!cert.replacesId,
      replacedCertId: cert.replacesId,
    },
  });

  return verified;
}

/**
 * Compliance officer rejects the AI extraction — document must be re-uploaded.
 * Transitions: PENDING_VERIFICATION → REVOKED (with rejection reason)
 */
async rejectCertification(
  certId: string,
  rejectedById: string,
  reason: string
): Promise<void> {
  await this.prisma.certification.update({
    where: { id: certId },
    data: {
      status: 'REVOKED',
      rejectedAt: new Date(),
      rejectedById,
      rejectionReason: reason,
    },
  });

  await this.auditService.log({
    action: 'CERTIFICATION_REVOKE',
    entityId: certId,
    entityType: 'certification',
    userId: rejectedById,
    details: { reason, wasAiExtraction: true },
  });
}
```

---

### 1d. API Controller Endpoints

```typescript
// apps/api/src/modules/crew/certifications.controller.ts

@Get('verification-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN')
async getVerificationQueue() {
  return this.certificationsService.getPendingVerificationQueue();
}

@Post(':id/verify')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN')
async verifyCertification(
  @Param('id') certId: string,
  @Body() body: VerifyCertificationDto,
  @GetUser() user: AuthUser,
) {
  return this.certificationsService.verifyCertification(certId, user.id, body.corrections);
}

@Post(':id/reject')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN')
async rejectCertification(
  @Param('id') certId: string,
  @Body() body: RejectCertificationDto,
  @GetUser() user: AuthUser,
) {
  return this.certificationsService.rejectCertification(certId, user.id, body.reason);
}

// DTOs
export class VerifyCertificationDto {
  @IsOptional()
  corrections?: {
    certificateNumber?: string;
    expiryDate?: string;
    issuingAuthority?: string;
    issuingCountry?: string;
  };
}

export class RejectCertificationDto {
  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters.' })
  reason: string;
}
```

---

## Part 2: Renewal Workflow

The renewal chain is handled automatically by the upload service (detecting an existing cert of the same type) and finalized during verification. What needs to be surfaced in the UI is the **cert history** — so a PSC inspector can see the full chain of certificates a crew member has held.

```typescript
// apps/api/src/modules/crew/certifications.service.ts

/**
 * Get the complete certificate history for a crew member and cert type.
 * Returns the chain from oldest to newest, showing the renewal audit trail.
 * Used in the crew member detail view and for PSC inspection readiness.
 */
async getCertificationHistory(
  crewId: string,
  certType: string
): Promise<CertificationHistoryChain> {
  const certs = await this.prisma.certification.findMany({
    where: { crewId, type: certType as any },
    include: {
      verifiedBy: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    crewId,
    certType,
    chain: certs.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      status: c.status,
      issueDate: c.issueDate,
      expiryDate: c.expiryDate,
      issuingAuthority: c.issuingAuthority,
      documentUrl: c.documentUrl,
      verifiedAt: c.verifiedAt,
      verifiedBy: c.verifiedBy
        ? `${c.verifiedBy.firstName} ${c.verifiedBy.lastName}`
        : null,
      replacesId: c.replacesId,
      replacedById: c.replacedById,
      isCurrentlyActive: c.status === 'VALID' && !c.replacedById,
    })),
  };
}

interface CertificationHistoryChain {
  crewId: string;
  certType: string;
  chain: {
    id: string;
    certificateNumber: string;
    status: string;
    issueDate: Date;
    expiryDate: Date;
    issuingAuthority: string;
    documentUrl: string | null;
    verifiedAt: Date | null;
    verifiedBy: string | null;
    replacesId: string | null;
    replacedById: string | null;
    isCurrentlyActive: boolean;
  }[];
}
```

---

## Part 3: Real Certificate Monitoring Job

### The Problem

`notifications.service.ts` runs every 30 seconds and emits hardcoded strings about fictional crew members. Replace it entirely with a real daily scheduler that queries the database.

```typescript
// apps/api/src/modules/notifications/notifications.service.ts
// FULL REPLACEMENT

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@gbferry/database';
import { AuditService } from '../audit/audit.service';

export interface ComplianceAlert {
  id: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail: string;
  affectedEntityType: 'crew' | 'vessel';
  affectedEntityId: string;
  affectedEntityName: string;
  daysRemaining?: number;
  timestamp: string;
  actionUrl: string;  // Deep link into the platform for one-click resolution
}

type AlertType =
  | 'STCW_CERT_EXPIRY'
  | 'MEDICAL_CERT_EXPIRY'
  | 'VESSEL_CERT_EXPIRY'
  | 'MSMD_EXPIRY'
  | 'PENDING_VERIFICATION_BACKLOG'
  | 'MANNING_DEFICIENCY';

const WARNING_DAYS = 30;
const CRITICAL_DAYS = 7;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Daily compliance scan — runs at 06:00 Nassau time (UTC-5, so 11:00 UTC).
   * Generates alerts for all upcoming certificate expiries and queues backlogs.
   * Replaces the previous demo-mode 30-second cron.
   */
  @Cron('0 11 * * *', { name: 'daily-compliance-scan', timeZone: 'UTC' })
  async runDailyComplianceScan(): Promise<void> {
    this.logger.log('Running daily compliance scan...');
    const alerts: ComplianceAlert[] = [];
    const now = new Date();

    // ── 1. STCW Certification expiry ─────────────────────────────────────────
    const expiringCerts = await this.prisma.certification.findMany({
      where: {
        status: { in: ['VALID', 'EXPIRING'] },
        expiryDate: {
          lte: new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000),
          gte: now,
        },
        replacedById: null,  // Not already superseded
      },
      include: {
        crew: {
          select: {
            id: true,
            familyName: true,
            givenNames: true,
            role: true,
            vessel: { select: { id: true, name: true } },
          },
        },
      },
    });

    for (const cert of expiringCerts) {
      const daysRemaining = Math.floor(
        (cert.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const severity = daysRemaining <= CRITICAL_DAYS ? 'critical' : 'warning';
      const crewName = `${cert.crew.familyName}, ${cert.crew.givenNames}`;

      alerts.push({
        id: `stcw-expiry-${cert.id}-${now.toISOString().split('T')[0]}`,
        type: 'STCW_CERT_EXPIRY',
        severity,
        message: `${cert.type} expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        detail: `${crewName} (${cert.crew.role}) — cert ${cert.certificateNumber} · ${cert.issuingAuthority}`,
        affectedEntityType: 'crew',
        affectedEntityId: cert.crew.id,
        affectedEntityName: crewName,
        daysRemaining,
        timestamp: now.toISOString(),
        actionUrl: `/crew/${cert.crew.id}/certifications`,
      });

      // Update cert status to EXPIRING in DB if within window
      if (cert.status === 'VALID') {
        await this.prisma.certification.update({
          where: { id: cert.id },
          data: { status: daysRemaining <= CRITICAL_DAYS ? 'EXPIRING' : 'EXPIRING' },
        });
      }
    }

    // ── 2. Medical certificate expiry ─────────────────────────────────────────
    const expiringMedicals = await this.prisma.medicalCertificate.findMany({
      where: {
        expiryDate: {
          lte: new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000),
          gte: now,
        },
      },
      include: {
        crew: {
          select: {
            id: true,
            familyName: true,
            givenNames: true,
            role: true,
          },
        },
      },
    });

    for (const med of expiringMedicals) {
      const daysRemaining = Math.floor(
        (med.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const crewName = `${med.crew.familyName}, ${med.crew.givenNames}`;

      alerts.push({
        id: `medical-expiry-${med.id}-${now.toISOString().split('T')[0]}`,
        type: 'MEDICAL_CERT_EXPIRY',
        severity: daysRemaining <= CRITICAL_DAYS ? 'critical' : 'warning',
        message: `Medical certificate (${med.type}) expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        detail: `${crewName} (${med.crew.role}) — issued by ${med.issuingAuthority}. MLC 2006 / BMA requirement.`,
        affectedEntityType: 'crew',
        affectedEntityId: med.crew.id,
        affectedEntityName: crewName,
        daysRemaining,
        timestamp: now.toISOString(),
        actionUrl: `/crew/${med.crew.id}`,
      });
    }

    // ── 3. Vessel certificate expiry (SMC, DOC, Load Line etc.) ──────────────
    const expiringVesselCerts = await this.prisma.vesselDocument.findMany({
      where: {
        status: { in: ['VALID', 'EXPIRING'] },
        expiryDate: {
          lte: new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000),
          gte: now,
        },
      },
      include: {
        vessel: { select: { id: true, name: true } },
      },
    });

    for (const doc of expiringVesselCerts) {
      if (!doc.expiryDate) continue;
      const daysRemaining = Math.floor(
        (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      alerts.push({
        id: `vessel-cert-${doc.id}-${now.toISOString().split('T')[0]}`,
        type: 'VESSEL_CERT_EXPIRY',
        severity: daysRemaining <= CRITICAL_DAYS ? 'critical' : 'warning',
        message: `${doc.type} expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
        detail: `${doc.vessel.name} — ${doc.title}. Vessel cannot depart once expired.`,
        affectedEntityType: 'vessel',
        affectedEntityId: doc.vessel.id,
        affectedEntityName: doc.vessel.name,
        daysRemaining,
        timestamp: now.toISOString(),
        actionUrl: `/vessels/${doc.vessel.id}/documents`,
      });
    }

    // ── 4. Pending verification backlog ───────────────────────────────────────
    const pendingCount = await this.prisma.certification.count({
      where: { status: 'PENDING_VERIFICATION' },
    });

    if (pendingCount > 0) {
      // Flag as critical if any have been waiting more than 48 hours
      const stalePending = await this.prisma.certification.count({
        where: {
          status: 'PENDING_VERIFICATION',
          createdAt: { lte: new Date(now.getTime() - 48 * 60 * 60 * 1000) },
        },
      });

      alerts.push({
        id: `verification-backlog-${now.toISOString().split('T')[0]}`,
        type: 'PENDING_VERIFICATION_BACKLOG',
        severity: stalePending > 0 ? 'critical' : 'warning',
        message: `${pendingCount} certificate${pendingCount !== 1 ? 's' : ''} awaiting verification`,
        detail: stalePending > 0
          ? `${stalePending} have been waiting over 48 hours. Unverified certs do not count toward compliance.`
          : 'Newly uploaded certificates require compliance officer review before they are active.',
        affectedEntityType: 'crew',
        affectedEntityId: 'system',
        affectedEntityName: 'Verification Queue',
        timestamp: now.toISOString(),
        actionUrl: '/crew/certifications/verification-queue',
      });
    }

    // ── 5. Broadcast all alerts via SSE ───────────────────────────────────────
    this.logger.log(`Daily scan complete. Broadcasting ${alerts.length} alert(s).`);

    for (const alert of alerts) {
      this.eventEmitter.emit('alert.broadcast', alert);
    }

    // ── 6. Audit log the scan ─────────────────────────────────────────────────
    await this.auditService.log({
      action: 'CERTIFICATIONS_EXPIRY_CHECK' as any,
      userId: 'SYSTEM',
      details: {
        alertsGenerated: alerts.length,
        criticalCount: alerts.filter((a) => a.severity === 'critical').length,
        warningCount: alerts.filter((a) => a.severity === 'warning').length,
        scanTimestamp: now.toISOString(),
      },
    });
  }

  /**
   * Hourly mark-expired job — finds certs that have passed their expiry date
   * and haven't been updated yet. Runs silently, no SSE broadcast.
   */
  @Cron('0 * * * *', { name: 'mark-expired-certs' })
  async markExpiredCertifications(): Promise<void> {
    const now = new Date();

    const expiredCount = await this.prisma.certification.updateMany({
      where: {
        status: { in: ['VALID', 'EXPIRING'] },
        expiryDate: { lt: now },
        replacedById: null,
      },
      data: { status: 'EXPIRED' },
    });

    const expiredMedicals = await this.prisma.medicalCertificate.updateMany({
      where: { expiryDate: { lt: now } },
      data: {},  // Medical doesn't have a status enum — trigger alert via scan
    });

    if (expiredCount.count > 0) {
      this.logger.warn(`Marked ${expiredCount.count} certification(s) as EXPIRED.`);
      await this.auditService.log({
        action: 'CERTIFICATIONS_EXPIRY_CHECK' as any,
        userId: 'SYSTEM',
        details: { markedExpired: expiredCount.count, timestamp: now.toISOString() },
      });
    }
  }
}
```

---

## Part 4: Document Viewer — Pre-signed S3 URL

```typescript
// apps/api/src/modules/documents/document-viewer.service.ts

import { Injectable, ForbiddenException } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

const URL_EXPIRY_SECONDS = 300; // 5 minutes — short window prevents link sharing

@Injectable()
export class DocumentViewerService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {
    const endpoint =
      config.get<string>('AWS_S3_ENDPOINT') || config.get<string>('MINIO_ENDPOINT');

    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION') || 'us-east-1',
      endpoint,
      forcePathStyle: Boolean(endpoint),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID') || config.get<string>('MINIO_ACCESS_KEY') || '',
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY') || config.get<string>('MINIO_SECRET_KEY') || '',
      },
    });

    this.bucket =
      config.get<string>('NODE_ENV') === 'production'
        ? config.get<string>('AWS_S3_BUCKET') || ''
        : config.get<string>('MINIO_BUCKET') || 'gbferry-documents';
  }

  /**
   * Generate a short-lived pre-signed URL for viewing a stored document.
   * Only users with the certifications.view permission can call this.
   * Every retrieval is audit-logged with the requesting user's ID.
   *
   * The URL expires in 5 minutes — long enough to view, short enough
   * to prevent redistribution.
   */
  async getSignedViewUrl(
    s3Key: string,
    requestingUserId: string,
    context: { entityType: string; entityId: string }
  ): Promise<{ url: string; expiresAt: string }> {
    if (!s3Key) {
      throw new ForbiddenException('No document is attached to this record.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    });

    const url = await getSignedUrl(this.s3, command, {
      expiresIn: URL_EXPIRY_SECONDS,
    });

    const expiresAt = new Date(Date.now() + URL_EXPIRY_SECONDS * 1000).toISOString();

    // Audit every document retrieval — ISO 27001 A.12.4.3
    await this.auditService.log({
      action: 'CREW_PII_ACCESSED' as any,
      userId: requestingUserId,
      entityType: context.entityType,
      entityId: context.entityId,
      details: {
        documentKey: s3Key,
        expiresAt,
        note: 'Pre-signed document URL generated for viewing',
      },
    });

    return { url, expiresAt };
  }
}
```

```typescript
// apps/api/src/modules/documents/documents.controller.ts

@Get('certifications/:certId/view')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COMPLIANCE_OFFICER', 'ADMIN', 'SUPERADMIN', 'CAPTAIN')
async getDocumentViewUrl(
  @Param('certId') certId: string,
  @GetUser() user: AuthUser,
) {
  const cert = await this.prisma.certification.findUniqueOrThrow({
    where: { id: certId },
  });

  if (!cert.documentUrl) {
    throw new NotFoundException('No document is attached to this certification.');
  }

  return this.documentViewerService.getSignedViewUrl(
    cert.documentUrl,
    user.id,
    { entityType: 'certification', entityId: certId }
  );
}
```

---

## Part 5: Verification Queue UI Component

```tsx
// apps/web/src/app/crew/certifications/verification-queue/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Alert, Badge, Button, Card, Col, Drawer, Descriptions,
  Empty, Layout, Row, Space, Spin, Tag, Tooltip, Typography, message,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, FilePdfOutlined, WarningOutlined,
} from '@ant-design/icons';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { api } from '@/lib/api';

const { Content } = Layout;
const { Title, Text } = Typography;

interface QueueItem {
  certificationId: string;
  crewName: string;
  crewRole: string;
  vesselName: string;
  certType: string;
  aiExtractedCertNumber: string | null;
  aiExtractedExpiry: string | null;
  aiExtractedAuthority: string | null;
  aiConfidenceScore: number;
  aiWarnings: string[];
  documentS3Key: string | null;
  isRenewal: boolean;
  uploadedAt: string;
}

function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? '#52c41a' : pct >= 50 ? '#faad14' : '#ff4d4f';
  const label = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  return (
    <Tooltip title={`AI extraction confidence: ${pct}%. ${pct < 50 ? 'Verify all fields carefully.' : ''}`}>
      <Tag style={{ color, borderColor: color, background: `${color}18` }}>
        {label} confidence ({pct}%)
      </Tag>
    </Tooltip>
  );
}

export default function VerificationQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    const res = await api.certifications.verificationQueue();
    if (res.data) setQueue(res.data);
    else message.error('Failed to load verification queue');
    setLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const openItem = async (item: QueueItem) => {
    setSelected(item);
    setDrawerOpen(true);
    setDocUrl(null);

    if (item.documentS3Key) {
      setLoadingDoc(true);
      const res = await api.documents.getViewUrl(item.certificationId);
      if (res.data?.url) setDocUrl(res.data.url);
      setLoadingDoc(false);
    }
  };

  const handleVerify = async (corrections?: Record<string, string>) => {
    if (!selected) return;
    setSubmitting(true);
    const res = await api.certifications.verify(selected.certificationId, { corrections });
    if (res.error) {
      message.error(res.error);
    } else {
      message.success(`Certificate verified for ${selected.crewName}`);
      setDrawerOpen(false);
      setSelected(null);
      fetchQueue();
    }
    setSubmitting(false);
  };

  const handleReject = async () => {
    if (!selected) return;
    const reason = window.prompt('Enter rejection reason (required):');
    if (!reason || reason.trim().length < 10) {
      message.warning('Rejection reason must be at least 10 characters.');
      return;
    }
    setSubmitting(true);
    const res = await api.certifications.reject(selected.certificationId, { reason });
    if (res.error) {
      message.error(res.error);
    } else {
      message.success('Certificate rejected. Crew member will need to re-upload.');
      setDrawerOpen(false);
      fetchQueue();
    }
    setSubmitting(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader />
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: 'linear-gradient(135deg, #0a1f33 0%, #0c2f4a 45%, #0b3a5d 100%)',
          minHeight: 'calc(100vh - 64px - 48px)',
        }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 12 }} />
                Verification Queue
                {queue.length > 0 && (
                  <Badge count={queue.length} style={{ marginLeft: 12, backgroundColor: '#ff4d4f' }} />
                )}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.55)' }}>
                AI-extracted certifications awaiting compliance officer review.
                Unverified certificates do not count toward compliance gates.
              </Text>
            </Col>
          </Row>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
            </div>
          ) : queue.length === 0 ? (
            <Card style={{ background: 'rgba(82,196,26,0.06)', border: '1px solid rgba(82,196,26,0.3)', textAlign: 'center', padding: 40 }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#52c41a', margin: 0 }}>Queue Clear</Title>
              <Text style={{ color: 'rgba(255,255,255,0.55)' }}>All uploaded certificates have been reviewed.</Text>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {queue.map((item) => (
                <Col xs={24} md={12} xl={8} key={item.certificationId}>
                  <Card
                    hoverable
                    onClick={() => openItem(item)}
                    style={{
                      background: item.aiConfidenceScore < 0.5
                        ? 'rgba(255,77,79,0.06)'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${item.aiConfidenceScore < 0.5 ? 'rgba(255,77,79,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <Space justify="space-between" style={{ width: '100%' }}>
                        <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>{item.crewName}</Text>
                        {item.isRenewal && <Tag color="blue">Renewal</Tag>}
                      </Space>

                      <Space wrap>
                        <Tag color="cyan">{item.certType}</Tag>
                        <Tag style={{ color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.15)', background: 'transparent' }}>
                          {item.crewRole}
                        </Tag>
                      </Space>

                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        {item.vesselName} · Uploaded {new Date(item.uploadedAt).toLocaleDateString()}
                      </Text>

                      <ConfidenceBadge score={item.aiConfidenceScore} />

                      {item.aiWarnings.length > 0 && (
                        <Alert
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                          message={item.aiWarnings[0]}
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        />
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {/* Verification Drawer */}
          <Drawer
            title={
              <Space>
                <Text style={{ color: '#e6f7ff', fontWeight: 600 }}>
                  Review: {selected?.crewName}
                </Text>
                {selected && <ConfidenceBadge score={selected.aiConfidenceScore} />}
              </Space>
            }
            placement="right"
            width={560}
            open={drawerOpen}
            onClose={() => { setDrawerOpen(false); setDocUrl(null); }}
            styles={{
              body: { background: '#0c2f4a' },
              header: { background: '#0a1f33', borderBottom: '1px solid rgba(255,255,255,0.1)' },
            }}
            footer={
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleReject}
                  loading={submitting}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleVerify()}
                  loading={submitting}
                  style={{ background: '#52c41a', borderColor: '#52c41a' }}
                >
                  Confirm & Verify
                </Button>
              </Space>
            }
          >
            {selected && (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {selected.aiWarnings.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="AI Extraction Warnings"
                    description={
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {selected.aiWarnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    }
                  />
                )}

                <Card style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                    AI-Extracted Values — Verify against original document
                  </Text>
                  <Descriptions column={1} size="small" style={{ marginTop: 12 }}>
                    <Descriptions.Item label={<Text style={{ color: 'rgba(255,255,255,0.55)' }}>Cert Number</Text>}>
                      <Text style={{ color: selected.aiExtractedCertNumber ? '#e6f7ff' : '#ff4d4f' }}>
                        {selected.aiExtractedCertNumber ?? '⚠ Not detected'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Text style={{ color: 'rgba(255,255,255,0.55)' }}>Expiry Date</Text>}>
                      <Text style={{ color: selected.aiExtractedExpiry ? '#e6f7ff' : '#ff4d4f' }}>
                        {selected.aiExtractedExpiry
                          ? new Date(selected.aiExtractedExpiry).toLocaleDateString()
                          : '⚠ Not detected'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Text style={{ color: 'rgba(255,255,255,0.55)' }}>Issuing Authority</Text>}>
                      <Text style={{ color: selected.aiExtractedAuthority ? '#e6f7ff' : '#ff4d4f' }}>
                        {selected.aiExtractedAuthority ?? '⚠ Not detected'}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* Document Preview */}
                <Card
                  title={
                    <Space>
                      <FilePdfOutlined style={{ color: '#1890ff' }} />
                      <Text style={{ color: '#e6f7ff' }}>Original Document</Text>
                    </Space>
                  }
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {loadingDoc ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                      <Spin />
                      <Text style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginTop: 8 }}>
                        Fetching secure document link...
                      </Text>
                    </div>
                  ) : docUrl ? (
                    <div>
                      <iframe
                        src={docUrl}
                        style={{ width: '100%', height: 400, border: 'none', borderRadius: 4 }}
                        title="Certificate document"
                      />
                      <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 8, display: 'block' }}>
                        Secure link expires in 5 minutes. This access is audit-logged.
                      </Text>
                    </div>
                  ) : (
                    <Text style={{ color: 'rgba(255,255,255,0.35)' }}>No document attached to this record.</Text>
                  )}
                </Card>
              </Space>
            )}
          </Drawer>
        </Content>
      </Layout>
    </Layout>
  );
}
```

---

## Unit Tests

```typescript
// apps/api/src/test/certifications-verification.spec.ts

describe('CertificationsService — Verification Queue', () => {
  it('should create new upload as PENDING_VERIFICATION, never VALID', async () => {
    // Upload → expect status === PENDING_VERIFICATION
  });

  it('should detect renewal when same cert type already exists for crew member', async () => {
    // Two uploads of STCW_COC for same crew → replacesId set on second
  });

  it('should transition cert to VALID on verify and archive the old cert', async () => {
    // verifyCertification() → new cert VALID, old cert EXPIRED with replacedById set
  });

  it('should apply corrections when verifier changes the expiry date', async () => {
    // Pass corrections.expiryDate → persisted on the verified record
  });

  it('should reject and set status to REVOKED with reason', async () => {
    // rejectCertification() → status REVOKED, rejectionReason persisted
  });

  it('should throw if trying to verify a cert that is not PENDING', async () => {
    // cert.status = VALID → expect BadRequestException
  });
});

describe('NotificationsService — Daily Scan', () => {
  it('should generate STCW_CERT_EXPIRY alert for cert expiring in 14 days', async () => {
    // Mock cert with expiryDate = now + 14 days → expect warning alert
  });

  it('should generate critical alert for cert expiring in 5 days', async () => {
    // Mock cert with expiryDate = now + 5 days → expect critical alert
  });

  it('should NOT generate alert for certs that have been superseded (replacedById set)', async () => {
    // Archived cert → no alert
  });

  it('should generate PENDING_VERIFICATION_BACKLOG alert when queue is not empty', async () => {
    // 3 pending certs → expect info/warning alert
  });

  it('should generate critical backlog alert when a cert has been pending over 48 hours', async () => {
    // cert.createdAt = now - 72h → expect critical alert
  });

  it('markExpiredCertifications should bulk-update certs past their expiry date', async () => {
    // 2 VALID certs with expiryDate yesterday → expect updateMany called with status EXPIRED
  });
});
```

---

## Summary of Changes

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `aiExtractedData`, `aiConfidenceScore`, `aiExtractionWarnings`, `replacedById`, `replacesId`, `rejectedAt`, `rejectionReason` to `Certification` |
| `document-upload.service.ts` | Always create as `PENDING_VERIFICATION`, detect renewals, store AI warnings |
| `certifications.service.ts` | Add `getPendingVerificationQueue()`, `verifyCertification()`, `rejectCertification()`, `getCertificationHistory()` |
| `certifications.controller.ts` | Add `GET /verification-queue`, `POST /:id/verify`, `POST /:id/reject` |
| `notifications.service.ts` | Full replacement — real daily cron + hourly expire-marker |
| `document-viewer.service.ts` | New — pre-signed S3 URL generation with 5-min expiry and audit log |
| `documents.controller.ts` | Add `GET /certifications/:id/view` endpoint |
| `verification-queue/page.tsx` | New UI page with card grid, confidence badges, inline PDF viewer, verify/reject actions |
