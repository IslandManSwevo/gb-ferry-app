# Architecture – Backend (api)

## Executive Summary
The `api` service is the central business logic hub for the GB Ferry platform. Built with NestJS, it provides a secure, modular, and scalable environment for managing maritime compliance and crew data.

## Technology Stack
- **Framework**: NestJS (Modular Architecture)
- **Language**: TypeScript
- **Database Access**: Prisma ORM (via `@gbferry/database`)
- **Security**: Keycloak (OIDC), `nest-keycloak-connect`, Helmet.
- **File Handling**: Multer, AWS SDK (S3/MinIO).
- **Automation**: Tesseract.js (OCR), PDF-parse.

## Architecture Pattern
The backend follows a **Modular Layered Architecture**:
1. **Controllers**: Handle HTTP requests, define API contracts, and enforce RBAC via Keycloak decorators.
2. **Services**: Contain the core business logic (e.g., safe manning engine, certificate verification).
3. **Gateways**: Encapsulate communication with external systems (e.g., BMA BORIS, USCG eNOAD).
4. **Repositories**: (Managed by Prisma) Provide data persistence.

## Key Modules
- **Crew**: Manages seafarer records and STCW certifications.
- **Compliance**: Implements the BMA R106 rules engine for safe manning.
- **CBP**: Handles regulatory submissions to US Customs and Border Protection.
- **Audit**: Provides an immutable audit trail for all system actions.
- **Vessels**: Manages the vessel registry and associated documentation.

## Data Architecture
The API interacts with a PostgreSQL database via the shared `database` package. It uses field-level encryption for sensitive PII (passport numbers).

## Deployment Architecture
- Deployed as a containerized Node.js application.
- Connects to PostgreSQL, Redis, and Keycloak via environment variables.
- Uses S3-compatible storage for binary assets.

## Testing Strategy
- **Unit Testing**: Jest is used for testing services and logic (e.g., `crew-validators`, `safe-manning.engine`).
- **Integration Testing**: Tests core service-to-database flows.
- **Coverage**: Targets high coverage for regulatory rules engines.
