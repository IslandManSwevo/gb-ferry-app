# FIX-05: Audit Log Completeness & Encryption Consistency

## Issues

The platform claims **ISO 27001 alignment** and has a functioning audit log — but two categories of events are completely unlogged, and PII encryption is inconsistently applied. Both issues would surface immediately in any third-party security review or PSC documentary inspection.

### Audit Log Gaps

The current audit log captures compliance actions (cert uploads, CBP submissions) but is missing:

| Missing Event Category               | Why It Matters                                           |
| ------------------------------------ | -------------------------------------------------------- |
| Failed login attempts                | ISO 27001 A.9.4.2 — required for brute-force detection   |
| Data export / download               | ISO 27001 A.12.4.3 — every PII export must be traceable  |
| Permission escalation                | ISO 27001 A.9.2.5 — role changes must be logged          |
| System configuration changes         | ISO 27001 A.12.4.1 — config changes are auditable events |
| Emergency fleet suspension triggered | Operational accountability                               |
| MSMD / vessel certificate updates    | Regulatory traceability                                  |

### Encryption Inconsistency

The platform encrypts `identityDocNumber` but `passportNumber`, `visaNumber`, and `alienRegistrationNumber` are not consistently encrypted across all models. For a maritime platform processing crew PII under the **Bahamas Data Protection Act** and handling CBP-bound data, every document number field must be encrypted at rest with the same key.

---

## What Needs to Change

### 1. Expanded Audit Event Enum

```typescript
// packages/dto/src/audit-event.enum.ts

export enum AuditAction {
  // ─── Authentication ────────────────────────────────────────────────────────
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED', // NEW — ISO 27001 A.9.4.2
  LOGOUT = 'LOGOUT',
  MFA_CHALLENGE_PASSED = 'MFA_CHALLENGE_PASSED',
  MFA_CHALLENGE_FAILED = 'MFA_CHALLENGE_FAILED', // NEW

  // ─── Access Control ────────────────────────────────────────────────────────
  ROLE_ASSIGNED = 'ROLE_ASSIGNED', // NEW — ISO 27001 A.9.2.5
  ROLE_REVOKED = 'ROLE_REVOKED', // NEW
  PERMISSION_ESCALATION = 'PERMISSION_ESCALATION', // NEW — e.g. temp admin access
  USER_CREATED = 'USER_CREATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',

  // ─── Data Access & Export ──────────────────────────────────────────────────
  DATA_EXPORT_INITIATED = 'DATA_EXPORT_INITIATED', // NEW — ISO 27001 A.12.4.3
  DATA_EXPORT_COMPLETED = 'DATA_EXPORT_COMPLETED', // NEW
  REPORT_DOWNLOADED = 'REPORT_DOWNLOADED', // NEW
  CREW_PII_ACCESSED = 'CREW_PII_ACCESSED', // NEW — when passport/visa data is decrypted for viewing

  // ─── Crew & Certification ──────────────────────────────────────────────────
  CREW_CREATED = 'CREW_CREATED',
  CREW_UPDATED = 'CREW_UPDATED',
  CREW_DELETED = 'CREW_DELETED',
  CERTIFICATION_UPLOADED = 'CERTIFICATION_UPLOADED',
  CERTIFICATION_VERIFIED = 'CERTIFICATION_VERIFIED',
  CERTIFICATION_EXPIRY_ALERT = 'CERTIFICATION_EXPIRY_ALERT',
  CREW_ASSIGNMENT_CHANGED = 'CREW_ASSIGNMENT_CHANGED',

  // ─── Vessel & Manning ─────────────────────────────────────────────────────
  MSMD_UPLOADED = 'MSMD_UPLOADED', // NEW — FIX-01 compliance
  MSMD_VALIDATED = 'MSMD_VALIDATED', // NEW
  MSMD_DEFICIENCY_DETECTED = 'MSMD_DEFICIENCY_DETECTED', // NEW
  VESSEL_CERTIFICATE_UPLOADED = 'VESSEL_CERTIFICATE_UPLOADED', // NEW — FIX-03
  VESSEL_CERTIFICATE_EXPIRED = 'VESSEL_CERTIFICATE_EXPIRED', // NEW

  // ─── Regulatory Submissions ───────────────────────────────────────────────
  I418_SUBMITTED = 'I418_SUBMITTED',
  I418_ACCEPTED = 'I418_ACCEPTED',
  I418_REJECTED = 'I418_REJECTED',
  I418_DEPARTURE_SUBMITTED = 'I418_DEPARTURE_SUBMITTED', // NEW — 8 CFR 251.3
  ENOAD_SUBMITTED = 'ENOAD_SUBMITTED',
  ENOAD_NOTICE_ID_RECEIVED = 'ENOAD_NOTICE_ID_RECEIVED', // NEW

  // ─── System Configuration ─────────────────────────────────────────────────
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED', // NEW — ISO 27001 A.12.4.1
  CBPSUBMISSION_TOGGLE = 'CBPSUBMISSION_TOGGLE', // NEW — auto-submit on/off
  EMERGENCY_FLEET_SUSPENDED = 'EMERGENCY_FLEET_SUSPENDED', // NEW
  EMERGENCY_FLEET_RESUMED = 'EMERGENCY_FLEET_RESUMED', // NEW

  // ─── Inspection ───────────────────────────────────────────────────────────
  PSC_INSPECTION_CREATED = 'PSC_INSPECTION_CREATED',
  PSC_DEFICIENCY_LOGGED = 'PSC_DEFICIENCY_LOGGED',
}
```

---

### 2. Expanded Audit Log Service

```typescript
// apps/api/src/modules/audit/audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@gbferry/dto';

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string; // Null for SYSTEM-triggered events
  entityType?: string;
  entityId?: string;
  ipAddress?: string; // NEW — required for login events
  userAgent?: string; // NEW — required for login events
  details?: Record<string, unknown>;
  // PII must never be logged in details — only IDs and status codes
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Immutable audit log write.
   * Records are insert-only — no update or delete operations are permitted
   * on the audit_logs table (enforced at the database level with a trigger
   * or by restricting Prisma operations to createOnly).
   */
  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId ?? 'SYSTEM',
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        // Stringify details but strip any PII keys before persisting
        details: entry.details ? JSON.stringify(this.stripPiiFromDetails(entry.details)) : null,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Ensure PII fields are never written to audit log details.
   * Passport numbers, visa numbers, and DOB must never appear in logs.
   */
  private stripPiiFromDetails(details: Record<string, unknown>): Record<string, unknown> {
    const PII_KEYS = [
      'passportNumber',
      'visaNumber',
      'alienRegistrationNumber',
      'identityDocNumber',
      'dateOfBirth',
      'placeOfBirth',
    ];
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      if (PII_KEYS.includes(key)) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}
```

---

### 3. Auth Guard — Log Failed Logins

Wire the audit log into the Keycloak/NextAuth authentication flow to capture failed logins.

```typescript
// apps/api/src/modules/auth/auth.guard.ts (additions)

import { AuditAction } from '@gbferry/dto';

// In the JWT validation exception handler:
async handleAuthFailure(
  request: Request,
  reason: string,
): Promise<void> {
  await this.auditService.log({
    action: AuditAction.LOGIN_FAILED,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    details: {
      reason,
      path: request.url,
      // Do NOT log attempted passwords or tokens
    },
  });
}
```

---

### 4. Encryption Consistency Audit

Every field containing a crew member's document number, visa, or biometric identifier must go through the **same** `EncryptionService`. Add a decorator to enforce this at the DTO level.

```typescript
// apps/api/src/modules/security/encrypted-field.decorator.ts

import { Transform } from 'class-transformer';
import { EncryptionService } from './encryption.service';

/**
 * Fields decorated with @EncryptedField will be automatically encrypted
 * when the DTO is transformed before persistence.
 *
 * Usage:
 *   @EncryptedField()
 *   passportNumber: string;
 */
export function EncryptedField() {
  return Transform(({ value, obj }) => {
    // Encryption happens in the service layer, not here.
    // This decorator is a marker for auditing and documentation.
    // The service layer is responsible for calling EncryptionService.encrypt().
    return value;
  });
}

// packages/dto/src/crew-member.dto.ts

export class CreateCrewMemberDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  nationality: string;

  @IsDateString()
  dateOfBirth: string;

  // ─── ALL document numbers marked as encrypted fields ──────────────────────
  @IsString()
  @EncryptedField()
  passportNumber: string; // AES-256-GCM encrypted at rest

  @IsString()
  @EncryptedField()
  seafarerIdNumber: string; // AES-256-GCM encrypted at rest

  @IsOptional()
  @IsString()
  @EncryptedField()
  visaNumber?: string; // AES-256-GCM encrypted at rest

  @IsOptional()
  @IsString()
  @EncryptedField()
  alienRegistrationNumber?: string; // AES-256-GCM encrypted at rest
}
```

---

### 5. Encryption Service — Consistent Implementation

```typescript
// apps/api/src/modules/security/encryption.service.ts

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY;
    if (!hexKey || !/^[a-fA-F0-9]{64}$/.test(hexKey)) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes / 256 bits)');
    }
    this.key = Buffer.from(hexKey, 'hex');
  }

  /**
   * Encrypt a plaintext string.
   * Returns a single base64 string: iv:authTag:ciphertext
   * Format is self-describing so future key rotation can be handled
   * by storing the key version alongside.
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Combine iv + authTag + ciphertext as base64
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypt a value produced by encrypt().
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;
    const buf = Buffer.from(ciphertext, 'base64');
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  /**
   * Return a redacted preview for display (e.g. "••••••3456").
   * Use this when showing document numbers in the UI — never decrypt
   * unless the user has explicit PII access permissions.
   */
  redact(ciphertext: string, visibleChars = 4): string {
    try {
      const plain = this.decrypt(ciphertext);
      return '•'.repeat(plain.length - visibleChars) + plain.slice(-visibleChars);
    } catch {
      return '••••••••';
    }
  }
}
```

---

### 6. Prisma Schema — Add Missing Audit Log Fields

```prisma
// packages/database/prisma/schema.prisma

model AuditLog {
  id          String   @id @default(cuid())
  timestamp   DateTime @default(now())
  action      String   // AuditAction enum value
  userId      String   // 'SYSTEM' for automated events
  entityType  String?
  entityId    String?
  ipAddress   String?  // NEW — required for auth events
  userAgent   String?  // NEW — required for auth events
  details     String?  // JSON string, PII stripped

  @@index([action])
  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

---

## Migration Notes

1. **Retroactive encryption**: Run a data migration to encrypt any `passportNumber` or `seafarerIdNumber` fields that were stored in plaintext. Do this in a transaction with a rollback path.
2. **Key rotation**: Store the encryption key version in the encrypted field prefix (e.g. `v1:base64...`) so future key rotation can be handled without decrypting all records simultaneously.
3. **GDPR / Bahamas Data Protection Act deletion**: Soft delete alone is insufficient. Implement a hard-delete path for crew PII that also triggers an `audit.log({ action: AuditAction.CREW_DELETED })` event and removes the encrypted fields from the database.
4. **Keycloak event listener**: Keycloak can emit login-success and login-failed events to an external webhook. Wire this webhook to `AuditService.log()` to capture auth events without touching the API auth guard.

### 7. Hardened PII Migration Script

```typescript
// scripts/migrate-to-audit-ready-pii.ts

import { PrismaClient } from '@gbferry/database';
import { EncryptionService } from '../apps/api/src/modules/security/encryption.service';
import { ConfigService } from '@nestjs/config';

async function migrate() {
  const db = new PrismaClient();
  const config = new ConfigService();
  const encryption = new EncryptionService(config);

  console.log('Starting PII migration to GCM-authenticated encryption...');

  const entries = await db.i418CrewEntry.findMany({
    where: {
      OR: [
        { passportNumber: { not: { startsWith: 'v1:' } } },
        { visaNumber: { not: { startsWith: 'v1:' } } },
      ],
    },
  });

  console.log(`Found ${entries.length} candidate entries for re-encryption.`);

  await db.$transaction(async (tx) => {
    for (const entry of entries) {
      const updateData: any = {};

      if (entry.passportNumber && !entry.passportNumber.startsWith('v1:')) {
        updateData.passportNumber = `v1:${encryption.encrypt(entry.passportNumber)}`;
      }

      if (entry.visaNumber && !entry.visaNumber.startsWith('v1:')) {
        updateData.visaNumber = `v1:${encryption.encrypt(entry.visaNumber)}`;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.i418CrewEntry.update({
          where: { id: entry.id },
          data: updateData,
        });
      }
    }
  });

  // Post-migration verification
  const staleCount = await db.i418CrewEntry.count({
    where: {
      OR: [
        { passportNumber: { not: { startsWith: 'v1:' } } },
        { visaNumber: { not: { startsWith: 'v1:' } } },
      ],
    },
  });

  if (staleCount === 0) {
    console.log('PII Migration SUCCESS: All fields are now v1 protected.');
  } else {
    console.error(`PII Migration PARTIAL: ${staleCount} entries remain unencrypted!`);
    process.exit(1);
  }
}

migrate().catch(console.error);
```

## References

- ISO 27001:2022 Annex A.9.4.2 (Secure log-on procedures)
- ISO 27001:2022 Annex A.9.2.5 (Review of user access rights)
- ISO 27001:2022 Annex A.12.4 (Logging and monitoring)
- Bahamas Data Protection Act (Ch. 324A)
- GDPR Article 17 (Right to erasure)
- NIST SP 800-57 (Key management recommendations)
