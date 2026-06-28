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
| UI | shadcn/ui + Tailwind CSS v4 (Ant Design fully removed) |
| Backend | NestJS 10, TypeScript 5 |
| Database | PostgreSQL 16 via Prisma 5 |
| Auth | Keycloak 23 + NextAuth 4 |
| Cache | Redis 7 |
| Storage | MinIO (dev) / AWS S3 (prod) |
| Deployment | Railway via nixpacks |

---

## Design System — Deep Trench Blue / Tactical Command

**This is the target design language for all new UI work.**

### Color Palette (strict — no deviations)

| Token | Hex | Usage |
|---|---|---|
| Trench Blue | `#0B132B` | Page background (dark mode default) |
| Navy Surface | `#0D1B3E` | Card backgrounds, sidebar |
| Navy Raised | `#122046` | Hover states, secondary surfaces |
| Action Cyan | `#00F2FE` | Primary actions, active states, data values, CTAs |
| Vermilion | `#FF4B2B` | Alerts, errors, critical warnings |
| Amber | `#FFB000` | Secondary warnings, caution states |
| Text Primary | `#E8EDF7` | Main text (dark mode) |
| Border | `rgba(0,242,254,0.15)` | All card/module borders |

**Light mode**: uses `#F0F4FF` background, `#FFFFFF` surface, `#0066CC` as the accent, `#0B132B` text.

**Theme toggle**: dark mode is default. Users can switch via the Sun/Moon button in AppHeader.
Theme state stored in `localStorage` key `gbferry-theme`, controlled by `ThemeProvider`.

### Typography

- **Page headings / section titles**: Space Grotesk (`font-display` utility class)
- **Body / navigation / UI labels**: Inter (`font-sans`)
- **Data values / IDs / timestamps / manifests**: JetBrains Mono (`font-mono`) — ALL data must use monospace
- **Micro-labels**: 10–11px monospace, uppercase, tracking `0.08em`

### Layout Rules

- `rounded-2xl` (1rem / 16px) for all cards and panels — the global default
- `rounded-lg` for buttons, badges, inputs
- `rounded-md` for small chips and tags
- 8px grid — all spacing divisible by 8px (4px for micro-adjustments)
- Soft card shadows on elevated surfaces (`shadow-card` utility)
- Subtle translucent overlays for accents are acceptable (`rgba` with low opacity)
- Icons: Lucide React only

### CSS Variables (runtime, not hardcoded)

Use `var(--foreground)`, `var(--muted-foreground)`, `var(--border)`, `var(--card)`, `var(--background)`, `var(--primary)`, `var(--accent)` in new code.
Only hardcode `#FF4B2B` (error), `#FFB000` (warning), `#00F2FE` (cyan data) when semantic CSS vars don't apply.

### Prohibited Style Patterns

- Hardcoding `#050505`, `#33FF33`, or any old Industrial Brutalist palette
- `rounded-none` or `border-radius: 0` — design uses rounded corners everywhere
- Green-on-black terminal aesthetic
- IBM Plex Mono as the primary font (JetBrains Mono replaces it for data)

### Key New Files

| File | Purpose |
|---|---|
| `apps/web/src/components/providers/ThemeProvider.tsx` | Dark/light mode context + localStorage persistence |
| `apps/web/src/components/ui/ThemeToggle.tsx` | Sun/Moon toggle button (used in AppHeader) |

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
