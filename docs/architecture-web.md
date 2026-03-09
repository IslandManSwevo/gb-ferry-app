# Architecture – Web (web)

## Executive Summary
The `web` application is the primary user interface for the GB Ferry platform. Built with Next.js 14, it offers a high-performance, responsive, and secure dashboard for maritime operations.

## Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Ant Design (v5)
- **Language**: TypeScript
- **Auth**: NextAuth.js (Keycloak Provider)
- **State/Data**: SWR (Stale-While-Revalidate)
- **Validation**: Zod (via `@gbferry/dto`)

## Architecture Pattern
The web application follows the **Next.js App Router Architecture**:
1. **Server Components**: (Default) For static content and secure initial data fetching.
2. **Client Components**: (`'use client'`) For interactive elements like the Command Center dashboard and forms.
3. **API Proxy**: Handles cross-origin requests to the `api` service.
4. **Hooks**: Custom React hooks for auth (`useUserRoles`) and data fetching.

## Key Features
- **Compliance Command Center**: Dashboard overview of fleet compliance and alerts.
- **Crew Management**: Directories, roster management, and certification tracking.
- **Regulatory Reporting**: Forms and exports for CBP and BMA requirements.
- **Audit Viewer**: Real-time stream and searchable log of system actions.
- **Fleet Analytics**: Visualized performance trends and risk forecasts.

## UI/UX Design
- **Aesthetic**: "Maritime Dark" with high-contrast status indicators.
- **Responsive**: Fully responsive design for desktop, tablet, and bridge-side monitors.
- **Navigation**: Sidebar with role-based visibility control.

## Integration Architecture
- Communicates with the `api` service via a centralized REST client (`apps/web/src/lib/api/client.ts`).
- Uses shared types and schemas from `@gbferry/dto`.
- Injects Bearer tokens from the `next-auth` session into API requests.

## Deployment Architecture
- Deployed as a containerized Node.js application (via `next build` and `next start`).
- Environment variables configure the API URL and Keycloak endpoints.

## Testing Strategy
- **Component Testing**: Testing individual UI elements.
- **E2E Testing**: Scenario-based testing for critical compliance workflows.
- **Linting**: ESLint and TypeScript for static code analysis.
