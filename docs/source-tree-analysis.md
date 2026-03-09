# Source Tree Analysis

## Project Overview
This project is organized as a monorepo using pnpm workspaces and Turborepo.

## Monorepo Structure

```text
GB Ferry App/
├── apps/               # Application services
│   ├── api/            # [Part: api] NestJS Backend API
│   └── web/            # [Part: web] Next.js Frontend UI
├── packages/           # Shared libraries and packages
│   ├── database/       # [Part: database] Prisma DB client & schema
│   └── dto/            # [Part: dto] Shared TypeScript types
├── docs/               # Project documentation (Project Knowledge)
├── docker/             # Infrastructure configuration (PostgreSQL, Keycloak)
├── _bmad/              # BMAD Method configuration and workflows
├── package.json        # Root package manifest
├── pnpm-workspace.yaml # Workspace definitions
└── turbo.json          # Build pipeline configuration
```

## Detailed Part Analysis

### 🖥️ apps/api (Backend)
- **src/main.ts**: Application entry point.
- **src/app.module.ts**: Root application module.
- **src/modules/**: Feature-based modular structure.
  - **audit/**: Immutable audit logging logic.
  - **auth/**: Keycloak integration and role guards.
  - **cbp/**: US CBP (I-418/eNOAD) reporting gateway.
  - **compliance/**: BMA safe manning and regulatory rules engine.
  - **crew/**: Seafarer management and STCW tracking.
  - **vessels/**: Vessel registry and document management.
- **src/lib/**: Shared backend utilities and validators.

### 🌐 apps/web (Web)
- **src/app/**: Next.js 14 App Router pages.
  - **page.tsx**: Compliance Command Center Dashboard.
  - **crew/**, **vessels/**, **compliance/**: Feature-specific page routes.
- **src/components/**: UI components categorized by feature and type.
  - **layout/**: Shared shell components (Sidebar, Header).
  - **ui/**: Reusable maritime-themed design elements.
- **src/lib/**: Frontend libraries (API client, Auth wrappers).

### 🗄️ packages/database (Shared Database)
- **prisma/schema.prisma**: Master data model definition.
- **prisma/seed.ts**: Demo and reference data seeder.
- **src/index.ts**: Database client export.

### 📦 packages/dto (Shared Types)
- **src/**: TypeScript interfaces and Zod validation schemas shared between API and Web.
