# Architecture – Database (database)

## Executive Summary
The `database` package is the single source of truth for the platform's data models. It manages the Prisma schema and client used by the `api` service.

## Technology Stack
- **ORM**: Prisma (v5.8)
- **Database**: PostgreSQL (v16)
- **Language**: TypeScript

## Architecture Pattern
The database follows a **Centralized Schema Pattern**:
1. **Schema Definition**: A master `schema.prisma` file defines all entities, enums, and relationships.
2. **Client Generation**: The Prisma Client is generated as an internal package `@gbferry/database`.
3. **Migrations**: Managed via Prisma Migrate (`prisma migrate dev`).
4. **Seeding**: A central `prisma/seed.ts` file provides reference data (e.g., ports, countries, default vessels).

## Key Data Domains
- **Crew Management**: Seafarers, Medical certificates, STCW certifications.
- **Vessel Registry**: Vessel dimensions, MSMD requirements, certificates, documents, owners.
- **Regulatory Reporting**: I-418 submissions, eNOAD USCG segments, CBP line entries.
- **Compliance & Audit**: BMA records, Inspections, Deficiencies, Immutable Audit Logs.
- **Platform Management**: System-wide settings and user accounts.

## Security & Integrity
- **Field-Level Encryption**: Sensitive PII fields (Passport/Visa/Alien registration numbers) are noted as encrypted at the application level.
- **Audit Immutability**: Uses a PostgreSQL trigger to enforce an append-only, immutable `AuditLog` table.
- **Data Retention**: `ExportHistory` includes a `retainUntil` field for regulatory compliance.

## Relationship Architecture
- **Vessels** are the core entity, linking to **Owners**, **Documents**, **CrewMembers**, **Inspections**, and **Submissions**.
- **CrewMembers** link to their **Certifications** and **Vessels**.
- **AuditLogs** link to **Users** and arbitrary system entities (`entityType`, `entityId`).

## Deployment Architecture
- Deployed as a shared PostgreSQL instance.
- Prisma migrations are executed during the CI/CD pipeline (`prisma migrate deploy`).
