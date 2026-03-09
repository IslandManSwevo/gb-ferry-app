# Project Overview

## Platform Purpose
The Grand Bahama Ferry Platform is a specialized SaaS solution for maritime crew STCW monitoring, US CBP regulatory reporting, and BMA (Bahamas Maritime Authority) compliance tracking.

## Core Features
- **Crew Compliance**: Automated STCW certification monitoring and expiry alerts.
- **Safe Manning Engine**: Real-time validation of vessel rosters against BMA R106 requirements.
- **Regulatory Reporting**: US CBP Form I-418 and eNOAD submission pipeline.
- **Audit Logging**: Immutable audit trail for all compliance-related activities.
- **Fleet Management**: Centralized vessel registry and wet-lease document management.

## Technology Stack
- **Frontend**: Next.js 14, Ant Design (Maritime Dark Theme).
- **Backend**: NestJS, TypeScript, Keycloak (OIDC).
- **Database**: PostgreSQL (Prisma ORM).
- **Infrastructure**: Docker, Redis, MinIO (S3-compatible).
- **Automation**: Tesseract.js (OCR), PDF-parse.

## Repository Structure
This project is a **Monorepo** managed with Turborepo and pnpm workspaces:
- `apps/api`: NestJS Backend.
- `apps/web`: Next.js Frontend.
- `packages/database`: Prisma schema and client.
- `packages/dto`: Shared TypeScript types and Zod schemas.

## Documentation Index
- **Architecture**: [Backend (api)](./architecture-api.md), [Web (web)](./architecture-web.md), [Database (database)](./architecture-database.md), [DTO (dto)](./architecture-dto.md).
- **API**: [API Contracts](./api-contracts-api.md).
- **Data**: [Data Models](./data-models-database.md).
- **UI**: [UI Component Inventory](./ui-component-inventory-web.md).
- **Integration**: [Integration Architecture](./integration-architecture.md).
- **Guides**: [Development Guide](./development-guide.md), [Deployment Guide](./deployment-guide.md).
- **Structure**: [Source Tree Analysis](./source-tree-analysis.md).
