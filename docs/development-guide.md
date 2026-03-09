# Development Guide

## Prerequisites
- **Node.js**: v20+ (recommended)
- **pnpm**: v8+
- **Docker & Docker Compose**: For local infrastructure.

## Getting Started

### 1. Repository Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your local secrets
```

### 2. Infrastructure
Start the local development services (PostgreSQL, Keycloak, Redis, MinIO, Mailhog):
```bash
docker-compose up -d
```
Verify services are healthy with `docker-compose ps`.

### 3. Database Initialization
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to local database
pnpm db:push

# (Optional) Seed demo data
pnpm --filter @gbferry/database db:seed
```

### 4. Development Server
Start all applications (API and Web) in development mode with live reload:
```bash
pnpm dev
```
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **API Docs**: http://localhost:3001/api/docs (Swagger)

## Common Commands
| Task | Command | Description |
| :--- | :--- | :--- |
| **Build** | `pnpm build` | Build all apps and packages |
| **Lint** | `pnpm lint` | Run ESLint across the monorepo |
| **Test** | `pnpm test` | Run Jest unit tests |
| **Clean** | `pnpm clean` | Remove build artifacts and node_modules |
| **DB Studio** | `pnpm db:studio` | Open Prisma Studio GUI |

## Key Services (Local)
- **Keycloak Admin**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001 (gbferry/gbferry_dev_s3)
- **Mailhog UI**: http://localhost:8025
- **PostgreSQL**: localhost:5433 (gbferry/gbferry_dev)

## Project Structure & Workflow
This project uses **Turborepo** to manage tasks and **pnpm workspaces** for dependency management. Refer to `source-tree-analysis.md` for detailed folder descriptions.
