# Integration Architecture

## Overview
The platform follows a modern decoupled architecture with a React-based frontend (Next.js) and a modular backend (NestJS). These parts communicate via a secure REST API and share common data definitions through internal packages.

## Communication Flow

### 1. Frontend to Backend (REST)
- **Client**: The web application uses a centralized API client located in `apps/web/src/lib/api/client.ts`.
- **Protocol**: HTTP/1.1 (Standard REST).
- **Format**: JSON for both requests and responses.
- **Base URL**: `http://localhost:3001/api/v1` (configurable via `NEXT_PUBLIC_API_URL`).

### 2. Authentication & Security
- **Identity Provider**: Keycloak (OIDC).
- **Frontend Auth**: `next-auth` manages the user session and token refresh.
- **Token Injection**: The API client automatically injects the `accessToken` into the `Authorization: Bearer <token>` header for every request.
- **Backend Validation**: NestJS uses `nest-keycloak-connect` to validate tokens and enforce role-based access control (RBAC).

## Shared Dependencies

### 📦 packages/dto (Data Transfer Objects)
- **Purpose**: Shared source of truth for request/response structures.
- **Usage**: Both `apps/api` and `apps/web` import types and Zod schemas from this package to ensure end-to-end type safety.
- **Validation**: Zod schemas are used for runtime validation on both ends.

### 🗄️ packages/database (Shared Schema)
- **Purpose**: Centralized Prisma schema and client.
- **Usage**: Primarily used by `apps/api` for database operations. It ensures that all backend modules use consistent data models.

## Data Flow Diagram (Conceptual)

```text
[ Browser (Next.js) ] 
       |
       | (1) REST Request + JWT
       v
[ API Gateway (NestJS) ] <------> [ Keycloak (Auth) ]
       |         (2) Validate Token
       |
       | (3) Business Logic (Modules)
       v
[ Prisma Client ] <-------------> [ PostgreSQL ]
       |         (4) DB Queries
       |
[ MinIO / S3 ] <----------------> [ Document Storage ]
                 (5) File Uploads
```

## Integration Points Summary
| From | To | Protocol | Data Format | Auth |
| :--- | :--- | :--- | :--- | :--- |
| Web | API | REST | JSON | Bearer JWT |
| API | Keycloak | OIDC | JSON | Client Secret |
| API | Postgres | TCP/IP | SQL (Prisma) | DB Credentials |
| API | MinIO/S3 | HTTPS | Binary/JSON | Access Keys |
| Web | Keycloak | OIDC | JSON | Authorization Code |
