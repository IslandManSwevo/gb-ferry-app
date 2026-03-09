# Deployment Guide

## Infrastructure Architecture

### Production Stack
- **Compute**: Containerized services (NestJS API, Next.js Web).
- **Database**: PostgreSQL (AWS RDS or managed instance).
- **Identity**: Keycloak (High Availability cluster).
- **Cache**: Redis (Managed ElastiCache or similar).
- **Storage**: AWS S3 for document and asset storage.
- **Secrets**: Environment variables or AWS Secrets Manager.

## Environment Configuration
The following environment variables are required for production:

### Database
- `DATABASE_URL`: Connection string for production PostgreSQL.

### Identity (Keycloak)
- `KEYCLOAK_URL`: Public URL of Keycloak.
- `KEYCLOAK_REALM`: Production realm name.
- `KEYCLOAK_CLIENT_ID`: Frontend client ID.
- `KEYCLOAK_CLIENT_SECRET`: Secret for frontend client.
- `KEYCLOAK_API_CLIENT_ID`: Backend client ID.
- `KEYCLOAK_API_CLIENT_SECRET`: Secret for backend client.

### Authentication
- `NEXTAUTH_URL`: Canonical URL of the web application.
- `NEXTAUTH_SECRET`: Secure 32-byte base64 secret.

### Storage (AWS S3)
- `AWS_REGION`: e.g., `us-east-1`.
- `AWS_S3_BUCKET`: Production bucket name.
- AWS credentials should be provided via IAM roles or standard environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).

### Security
- `ENCRYPTION_KEY`: 32-byte hex key for field-level PII encryption. **CRITICAL: Rotate and protect.**

## Build & Artifacts
The platform is built using:
```bash
pnpm install --frozen-lockfile
pnpm build
```
Build outputs are located in:
- `apps/web/.next`
- `apps/api/dist`
- `packages/*/dist`

## CI/CD Pipeline
Refer to `.github/workflows/` (if present) for automation details. The pipeline should include:
1. Linting and Type checking.
2. Unit and Integration testing.
3. Building production artifacts.
4. Database migration (`prisma migrate deploy`).
5. Deployment to target environment.
