# Project Documentation Index

## Project Overview
- **Name**: GB Ferry App
- **Type**: Monorepo with 4 parts
- **Primary Language**: TypeScript
- **Architecture**: Modular Backend (NestJS) and Next.js App Router Frontend.

## Quick Reference

### apps/api (api)
- **Type**: Backend
- **Tech Stack**: NestJS, TypeScript, Prisma, Keycloak
- **Root**: `apps/api`

### apps/web (web)
- **Type**: Web
- **Tech Stack**: Next.js, Ant Design, NextAuth, SWR
- **Root**: `apps/web`

### packages/database (database)
- **Type**: Backend / Data
- **Tech Stack**: Prisma, PostgreSQL
- **Root**: `packages/database`

### packages/dto (dto)
- **Type**: Library
- **Tech Stack**: TypeScript, Zod
- **Root**: `packages/dto`

## Generated Documentation
- [Project Overview](./project-overview.md)
- [Architecture – Backend (api)](./architecture-api.md)
- [Architecture – Web (web)](./architecture-web.md)
- [Architecture – Database (database)](./architecture-database.md)
- [Architecture – DTO (dto)](./architecture-dto.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [API Contracts – Backend (api)](./api-contracts-api.md)
- [Data Models – Database (database)](./data-models-database.md)
- [UI Component Inventory – Web (web)](./ui-component-inventory-web.md)
- [Integration Architecture](./integration-architecture.md)
- [Development Guide](./development-guide.md)
- [Deployment Guide](./deployment-guide.md)

## Existing Documentation
- [Root README](../README.md)
- [Implementation Status](../IMPLEMENTATION_STATUS.md)
- [Prisma Wiring Guide](../PRISMA_WIRING_GUIDE.md)
- [Executive Board Presentation](./BOARD_PRESENTATION.md)
- [Security & Governance Whitepaper](./SECURITY_AND_GOVERNANCE.md)
- [Platform User Guide](./PLATFORM_USER_GUIDE.md)

## Getting Started
1. Run `pnpm install`.
2. Start infrastructure with `docker-compose up -d`.
3. Follow the [Development Guide](./development-guide.md) for full setup.
