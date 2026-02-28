# Maritime Platform Security & Access Governance

**Document ID**: SEC-2026-001
**Classification**: INTERNAL
**Updated**: February 28, 2026

## 1. Governance Model: Role-Based Access Control (RBAC)

The platform utilizes a hierarchical RBAC model designed specifically for maritime hierarchies and regulatory reporting duties.

| Role                   | Access Level       | Responsibilities                                                |
| :--------------------- | :----------------- | :-------------------------------------------------------------- |
| **SuperAdmin**         | Global Override    | System configuration, RBAC management, Emergency Lockdown.      |
| **Admin**              | Organizational     | Staff onboarding, Fleet-wide oversight, Policy overrides.       |
| **Compliance Officer** | Audit & Regulatory | Inspection recording, CBP/BMA submission, certification verify. |
| **Vessel Master**      | Operational (Ship) | Crew validation, Safe manning check, Bridge overrides.          |
| **Ops Staff**          | Functional (Port)  | Crew certification management, Doc intake, Crew list view.      |
| **Regulator**          | Read-Only          | Audit log viewing, Compliance reporting.                        |

## 2. Operational Security Guardrails

- **Safe Manning Enforcement**: Prevents vessel "Ready for Departure" status if the assigned crew count or qualification mix fails BMA R106 requirements.
- **Remote Bridge Override (Architectural Design)**: Allows shore-side Admin/Master to approve a crew assignment if the ship's satellite link is degraded.
- **Emergency Suspension**: A global 'Stop' command that terminates all active sessions and freezes administrative systems. UI exists in SuperAdmin hub.

## 3. Data Integrity & PII Protection

- **Immutable Audit Trail**: Based on ISO 27001 A.8.15 standards. Every change to a crew record or regulatory filing is logged with a cryptographic timestamp and user ID.
- **PII Masking**: Sensitive crew data (Passport Numbers, Seafarer IDs, Dates of Birth) are masked in general views and only revealed to users with specific `PII_VIEW` entitlements.
- **Encryption**: All data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3).

## 4. Compliance Gates

The system enforces regulatory standards at the software layer, blocking non-compliant workflows:

1. **Safe Manning Gate**: Vessel cannot be marked **READY** if the active roster fails the BMA R106 minimum requirement for that vessel class.
2. **Certification Validity Gate**: A crew member cannot be **ASSIGNED** to a watch if their mandatory STCW certifications have less than 7 days of validity remaining.
3. **Transmission Gate**: Regulatory forms (CBP I-418, BMA reports) cannot be **SUBMITTED** if the underlying crew data is flagged as "Incomplete" or "Invalid".
