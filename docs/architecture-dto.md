# Architecture – DTO (dto)

## Executive Summary
The `dto` package is a shared TypeScript library providing data transfer objects (DTOs) and Zod validation schemas for use across the entire monorepo.

## Technology Stack
- **Language**: TypeScript
- **Validation**: Zod (v3.22)
- **Linting**: ESLint

## Architecture Pattern
The `dto` package follows a **Shared Types Library Pattern**:
1. **Type Definition**: Interfaces for every object exchanged over the API.
2. **Schema Definition**: Zod schemas used to validate data at runtime.
3. **Internal Package**: Shared via pnpm workspaces (`@gbferry/dto`).

## Key Modules
- **Crew**: Types for crew members and certifications.
- **Vessel**: Registry and MSMD schema definitions.
- **Compliance**: Report and alert data structures.
- **Audit**: Schema for audit log entries.
- **CBP**: US Customs and Border Protection submission types.
- **Common**: Pagination and generic response wrappers.

## Strategic Role
This package ensures **End-to-End Type Safety**:
- **Backend**: Uses Zod schemas within NestJS pipes for request validation.
- **Frontend**: Uses the same types for API client results and form validation.

## Deployment Architecture
- Deployed as a build-time dependency for `apps/web` and `apps/api`.
- Built using `tsc` (TypeScript Compiler) into `dist/`.
