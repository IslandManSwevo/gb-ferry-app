# Data Models - Database (database)

## Overview
The database uses PostgreSQL managed via Prisma ORM. It is designed for IMO FAL and BMA (Bahamas Maritime Authority) regulatory compliance.

## Core Entities

### 👥 Crew Management
- **User**: Keycloak-synced users with role-based access.
- **CrewMember**: Personal details, passport (encrypted), visa information, and vessel assignments.
- **MedicalCertificate**: ENG_1 or equivalent certificates for crew members.
- **Certification**: STCW certifications (CoC, CoP) and BMA endorsements. Includes AI extraction metadata.

### 🚢 Vessel Registry
- **Vessel**: IMO-registered vessel details (Dimensions, Tonnage, Build info).
- **VesselMSMD**: Minimum Safe Manning Document requirements.
- **VesselCertificate**: Vessel-level certificates (SMC, DOC, Load Line, etc.).
- **VesselDocument**: General documents (wet-lease, registration) with S3 storage.
- **VesselOwner**: Ownership details (beneficial, managing owners).

### 👮 Regulatory & Compliance
- **I418Submission**: US CBP Form I-418 crew list submissions.
- **I418CrewEntry**: Line items for crew members in a CBP submission.
- **ENoadSegment**: Electronic Notice of Arrival/Departure USCG segments.
- **BmaComplianceRecord**: Specific records for Bahamas Maritime Authority.
- **SafeManningRequirement**: R106 compliance rules per vessel.
- **Inspection**: Port State Control (PSC) or Flag State inspections.
- **InspectionDeficiency**: Deficiencies found during inspections.

### 📝 Governance
- **AuditLog**: **IMMUTABLE** append-only log of all critical actions.
- **ExportHistory**: Tracking of all data exports (PDF/XLSX) for regulatory auditing.
- **PlatformSetting**: Dynamic system configuration (group-based).

## Critical Enums
- **CrewRole**: Comprehensive list of deck, engine, and catering roles.
- **CertificationStatus**: `VALID`, `EXPIRING`, `EXPIRED`, `REVOKED`, `PENDING_VERIFICATION`.
- **AuditAction**: Detailed action codes for security and compliance monitoring.
- **VesselCertificateType**: SMC, DOC, Load Line, Radio, MSMD, etc.

## Security Features
- **Field-Level Encryption**: Passport numbers, alien registration numbers, and visa numbers are encrypted at the application layer.
- **Audit Immutability**: Database-level trigger recommended to prevent deletion or modification of `AuditLog` entries.
