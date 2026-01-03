# Grand Bahama Ferry - Maritime Compliance Platform

Enterprise-grade SaaS platform for passenger manifest management, crew compliance tracking, and regulatory reporting.

## 🚢 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### 1. Clone and Install

```bash
# Install dependencies
pnpm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Keycloak, Redis, MinIO
docker-compose up -d

# Wait for services to be healthy
docker-compose ps
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed demo data
pnpm --filter @gbferry/database db:seed
```

### 4. Start Development

```bash
# Start all apps (frontend + backend)
pnpm dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Keycloak**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (gbferry/gbferry_dev_s3)
- **Mailhog**: http://localhost:8025

## 📁 Project Structure

```
gbferry-platform/
├── apps/
│   ├── web/                 # Next.js 14 Frontend (Ant Design)
│   │   ├── src/app/         # App Router pages
│   │   ├── src/components/  # UI components
│   │   └── src/theme/       # Ant Design theme
│   └── api/                 # NestJS Backend
│       └── src/modules/     # Feature modules
│           ├── passengers/  # Passenger check-in & manifests
│           ├── crew/        # Crew & certifications
│           ├── vessels/     # Vessel registry & documents
│           ├── compliance/  # Export adapter (CSV/PDF/XML)
│           └── audit/       # Immutable audit logging
├── packages/
│   ├── dto/                 # Shared TypeScript types & Zod schemas
│   └── database/            # Prisma schema & client
├── docker/
│   ├── postgres/            # DB initialization
│   └── keycloak/            # Realm configuration
└── docs/                    # Documentation
```

## 🔐 Demo Users (Keycloak)

| Email                  | Password      | Role               |
| ---------------------- | ------------- | ------------------ |
| admin@gbferry.com      | admin123      | Administrator      |
| ops@gbferry.com        | ops123        | Operations Staff   |
| compliance@gbferry.com | compliance123 | Compliance Officer |
| captain@gbferry.com    | captain123    | Vessel Captain     |

_Note: Passwords are temporary and will require change on first login._

## 🎯 Core Features

### MVP Features

- ✅ Passenger check-in with consent capture
- ✅ Manifest generation with manual approval workflow
- ✅ Crew certification tracking (STCW compliance)
- ✅ Vessel registration & safe manning (BMA R106)
- ✅ Wet-lease document management
- ✅ Compliance export adapter (Bahamas, Jamaica, Barbados)
- ✅ Immutable audit logging

### Security

- Role-based access control (RBAC) via Keycloak
- MFA required for admin users
- Field-level encryption for passport numbers
- TLS 1.3 in transit, AES-256 at rest
- GDPR & Bahamas Data Protection Act aligned

## 📜 Scripts

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all packages

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB
pnpm db:studio        # Open Prisma Studio

# Utilities
pnpm lint             # Lint all packages
pnpm format           # Format with Prettier
pnpm clean            # Clean build artifacts
```

## 🌍 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="postgresql://gbferry:gbferry_dev@localhost:5433/gbferry_db"
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="gbferry"
KEYCLOAK_CLIENT_ID="gbferry-web"
NEXTAUTH_SECRET="generate-secure-secret"
ENCRYPTION_KEY="generate-32-byte-hex-key"
```

## 📋 Regulatory Alignment

This platform is designed to support (not replace) regulatory workflows:

- **IMO FAL Form 5**: Passenger/crew manifest format
- **BMA Seafarer Documents**: Crew certification fields
- **BMA R102-R106**: Vessel registration forms
- **Marine Notices**: Validation rules (cert expiry, safe manning)

All regulatory decisions remain with government authorities.

## 📄 License

Proprietary - Grand Bahama Ferry Ltd.
