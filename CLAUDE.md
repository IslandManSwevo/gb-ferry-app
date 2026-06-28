# GB Ferry — Claude Code Context

## Project Overview

Enterprise maritime SaaS platform for crew STCW compliance, US CBP regulatory reporting (I-418/eNOAD), and BMA certification tracking. Operated by Grand Bahama Ferry Ltd.

## Monorepo Structure

```
pnpm workspaces + Turborepo
├── apps/api        — NestJS 10 backend (@gbferry/api)
├── apps/web        — Next.js 14 frontend (@gbferry/web)
├── packages/database — Prisma schema + client (@gbferry/database)
└── packages/dto    — Shared Zod schemas + TypeScript types (@gbferry/dto)
```

### Key pnpm Commands

```bash
pnpm dev                              # Start all apps
pnpm build                            # Build all (turbo)
pnpm --filter @gbferry/api test       # Run API unit tests (Jest, 17 spec files)
pnpm --filter @gbferry/api build      # Build API only (catches TS errors)
pnpm --filter @gbferry/web build      # Build web only (catches Next.js errors)
pnpm db:generate                      # Regenerate Prisma client
pnpm db:push                          # Push schema to DB
pnpm format                           # Run Prettier across all packages
```

### Turbo Pipeline

Build order: `@gbferry/dto` → `@gbferry/database` → `@gbferry/api` → `@gbferry/web`

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 App Router, React 18 |
| Current UI | Ant Design 5 (being migrated — see Design System below) |
| Target UI | shadcn/ui + Tailwind CSS |
| Backend | NestJS 10, TypeScript 5 |
| Database | PostgreSQL 16 via Prisma 5 |
| Auth | Keycloak 23 + NextAuth 4 |
| Cache | Redis 7 |
| Storage | MinIO (dev) / AWS S3 (prod) |
| Deployment | Railway via nixpacks |

---

## Design System — Industrial Brutalist / Tactical Telemetry

**This is the target design language for all new UI work.**

### Color Palette (strict — no deviations)

| Token | Hex | Usage |
|---|---|---|
| Terminal Black | `#050505` | Page background, card backgrounds |
| Phosphor Glow | `#33FF33` | Primary actions, active states, CTAs |
| Vermilion | `#FF4B2B` | Alerts, errors, critical warnings |
| Cyan | `#00FFFF` | Data values, informational content |
| Amber | `#FFB000` | Secondary warnings, caution states |
| Border | `1px solid rgba(51,255,51,0.2)` | All module borders |

**60/30/10 Rule**: 60% Terminal Black, 30% muted borders/dividers, 10% Phosphor Glow.

### Typography

- **UI labels / navigation**: Geist or Inter, system font stack
- **Telemetry data / IDs / manifests**: IBM Plex Mono or JetBrains Mono — ALL data values must use monospace
- **Headers**: Uppercase, tight tracking (`-0.05em`), heavy weight
- **Micro-labels**: 10–14px monospace, generous tracking (`+0.1em`), all-caps

### Layout Rules (non-negotiable)

- `border-radius: 0` everywhere — `rounded-none` is the global default. Zero exceptions.
- 8px grid — all spacing must be divisible by 8px (4px for micro-adjustments)
- CSS Grid compartmentalization — all modules enclosed in solid 1px borders
- No gradients, no soft shadows, no glassmorphism, no translucent overlays
- Icons: Lucide React only, mechanical/utilitarian variants only

### Prohibited Style Patterns

- Any `rounded-*` class other than `rounded-none`
- Soft box-shadows (`shadow-sm`, `shadow-md`, etc.)
- Warm/creamy colors, pastels, or any palette not listed above
- Translucent backgrounds (rgba with opacity)
- Gradient backgrounds or borders

---

## API Modules (NestJS — apps/api/src/modules/)

| Module | Domain |
|---|---|
| `crew` | Crew members, certifications, BMA gateway |
| `vessels` | Vessel registry, safe manning, certificates |
| `cbp` | US CBP I-418 form, eNOAD SOAP gateway |
| `compliance` | BMA BORIS, export adapter, PSC risk |
| `audit` | Immutable audit logging (ISO 27001) |
| `documents` | Upload, S3 storage, AI extraction (Tesseract + OCR) |
| `fleet-analytics` | Trends, vessel scores, 30/60/90-day forecasts |
| `notifications` | SSE real-time push for STCW expiry alerts |
| `bridge-sync` | Offline cache-aside + sync interceptor |
| `auth` | Keycloak integration, LoggingAuthGuard, RBAC |
| `settings` | Platform configuration (PostgreSQL-backed) |

### NestJS Module Pattern

Every feature follows: `*.module.ts` → `*.service.ts` → `*.controller.ts` → `*.spec.ts`
Always add new services to the module's `providers` array and export them if used by other modules.

---

## Frontend Routes (Next.js App Router — apps/web/src/app/)

```
app/
├── (auth)/          — Keycloak login/error pages
├── audit/           — Immutable audit log viewer
├── compliance/      — Alerts, BMA, CBP, exports, fleet, inspections, reports
├── crew/            — Certifications, safe-manning
├── emergency/       — Crew muster stations, emergency SOPs
├── settings/        — Platform settings
├── vessels/         — Vessel registry, documents
└── unauthorized/    — RBAC denial page
```

### Frontend Key Files

| File | Purpose |
|---|---|
| `apps/web/src/lib/api/client.ts` | Typed API client — all backend calls go through here |
| `apps/web/src/lib/auth/roles.ts` | `useHasRole()`, `useCanAccess()` hooks |
| `apps/web/src/lib/auth/access.ts` | `FEATURE_ACCESS` map — role→feature permissions |
| `apps/web/src/components/layout/AppSidebar.tsx` | Main navigation |
| `apps/web/src/components/layout/AppHeader.tsx` | Top bar |
| `apps/web/src/middleware.ts` | Route protection (all dashboard routes) |

---

## Authentication & RBAC

**Keycloak Realm**: `gbferry`
**Production Keycloak URL**: `https://zesty-abundance-production-f321.up.railway.app`
**Admin console**: append `/admin` to the URL

**Roles** (6 defined in `apps/web/src/lib/auth/roles.ts`):
`superadmin`, `admin`, `compliance_officer`, `operations`, `captain`, `regulator`

**Demo users** (in gbferry realm):
- `admin@gbferry.com` / `admin123`
- `ops@gbferry.com` / `ops123`
- `compliance@gbferry.com` / `compliance123`
- `captain@gbferry.com` / `captain123`

---

## Railway Deployment

**Project**: `hearty-radiance`
**Services**: `@gbferry/api`, `@gbferry/web`, `Postgres`, `zesty-abundance` (Keycloak)

```bash
railway service "@gbferry/api"          # Link to API service
railway logs --build --latest --lines 100  # Build logs
railway logs --latest --lines 50         # Runtime logs
railway variables                        # Show env vars for linked service
```

### Common Railway Failures & Fixes

| Error | Cause | Fix |
|---|---|---|
| `Property 'default' does not exist` on pdf-parse | node16 moduleResolution sees ESM build | Use `(module as any).default ?? module` pattern |
| `Module not found: @/*` | Missing `baseUrl: "."` in web tsconfig | Restore `baseUrl` in `apps/web/tsconfig.json` |
| `invalid_client_credentials` | Keycloak client secret mismatch | Sync Railway `KEYCLOAK_CLIENT_SECRET` with Keycloak client config |
| `user_not_found` | Wrong username format | Use email (`admin@gbferry.com`), not bare `admin` |

---

## Database

**Schema location**: `packages/database/prisma/schema.prisma`
**Key models**: `CrewMember`, `Certification`, `Vessel`, `VesselMSMD`, `I418Submission`, `BmaComplianceRecord`, `AuditLog` (append-only), `Inspection`, `PlatformSetting`

Passport numbers and seafarer IDs are **field-level encrypted** (AES-256-GCM). The `ENCRYPTION_KEY` env var must be a 64-char hex string (32 bytes).

---

## Testing

```bash
pnpm --filter @gbferry/api test          # All unit tests
pnpm --filter @gbferry/api test:cov      # Coverage report
```

Test files live alongside source as `*.spec.ts`. The web app has no tests yet.
Mocks: Prisma and external gateways (BMA BORIS, USCG eNOAD) are mocked in unit tests.

---

## Environment Files

| File | Purpose |
|---|---|
| `.env.example` | Template — copy to `.env` for local dev |
| `.env` | Local development (localhost hostnames) |
| `.env.docker` | Docker Compose network (internal hostnames) |

**Never commit `.env` or `.env.local`** — they contain the live `ENCRYPTION_KEY` and Keycloak secrets.
