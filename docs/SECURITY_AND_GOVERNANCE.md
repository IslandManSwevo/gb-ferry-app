# Maritime Platform Security & Access Governance

**Document ID**: SEC-2026-001
**Classification**: INTERNAL

## 1. Governance Model: Role-Based Access Control (RBAC)

The platform utilizes a hierarchical RBAC model designed specifically for maritime hierarchies.

| Role                   | Access Level       | Responsibilities                                                 |
| :--------------------- | :----------------- | :--------------------------------------------------------------- |
| **SuperAdmin**         | Global Override    | System configuration, RBAC management, Emergency Lockdown.       |
| **Admin**              | Organizational     | User onboarding, Fleet-wide manifests, Policy overrides.         |
| **Compliance Officer** | Audit & Regulatory | Inspection recording, manifest submission, certification verify. |
| **Vessel Master**      | Operational (Ship) | Manifest approval, Safe manning check, Bridge overrides.         |
| **Ops Staff**          | Functional (Port)  | Passenger check-in, Manifest generation, Crew list view.         |
| **Regulator**          | Read-Only          | Audit log viewing, Compliance reporting.                         |

## 2. Operational Security Guardrails

- **Manifest Hard-Lock (Design-Stage)**: Prevents port-side edits once a manifest is in "Pre-Departure" state (15 mins prior). Currently implemented as a UI toggle with backend enforcement scheduled for Phase 2.
- **Remote Bridge Override (Architectural Design)**: Allows shore-side Admin/Master to approve a manifest if the ship's satellite link is degraded.
- **Emergency Suspension (Design-Stage)**: A global 'Stop' command that terminates all active sessions and freezes check-in systems. UI exists in SuperAdmin hub; backend activation is roadmapped.

## 3. Data Integrity & PII Protection

- **Immutable Audit Trail**: Based on ISO 27001 A.8.15 standards. Every change to a manifest or crew record is logged with a cryptographic timestamp and user ID.
- **PII Masking**: Sensitive passenger data (Passport Numbers, Dates of Birth) are masked in general views and only revealed to users with specific `PII_VIEW` entitlements.
- **Encryption**: All data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.3).

## 4. Compliance Gates

The system enforces "Safe Manning" and "Document Validity" at the software layer:

1. Vessel cannot be marked **READY** if the assigned crew count is below the BMA R106 requirement.
2. A manifest cannot be **APPROVED** if any passenger has an expired primary identity document.
3. A crew member cannot be **ASSIGNED** if their STCW certifications have less than 7 days of validity remaining.
