---
name: deploy-check
description: Pre-Railway deployment verification. Runs both app builds locally, checks tsconfig integrity, and surfaces env var mismatches before pushing to Railway. Usage: /deploy-check
---

# Deploy Check — Pre-Railway Verification

Run this before every `git push` that will trigger a Railway deployment.
Based on past failures in this project, these are the exact checks that catch build breaks before Railway does.

## Step 1 — Build the API

```bash
cd "C:\Users\green\GB Ferry App"
pnpm --filter @gbferry/api build
```

Watch for:
- TypeScript errors (TS2339, TS2307, etc.)
- `pdf-parse` or other ESM/CJS interop issues — fix with `(module as any).default ?? module`
- Missing Prisma client — run `pnpm db:generate` first if needed

## Step 2 — Build the Web App

```bash
pnpm --filter @gbferry/web build
```

Watch for:
- `Module not found: @/*` — means `baseUrl: "."` is missing from `apps/web/tsconfig.json`
- `Module not found: @gbferry/dto` — means dto package needs rebuild (`pnpm --filter @gbferry/dto build`)
- Next.js invalid config warnings (unrecognized keys in `next.config.js`)

## Step 3 — Verify tsconfig Integrity

Check `apps/web/tsconfig.json` has `"baseUrl": "."` in compilerOptions.
Check `apps/api/tsconfig.json` — `module` and `moduleResolution` should be `node16`.

## Step 4 — Check Railway Env Var Alignment

Run for each service that's changing:
```bash
railway service "@gbferry/api" && railway variables
railway service "@gbferry/web" && railway variables
```

Compare against `.env` — specifically:
- `KEYCLOAK_CLIENT_SECRET` in Railway web must match the `gbferry-web` client secret in Keycloak
- `KEYCLOAK_URL` must be reachable from the container (use the Railway internal URL for server-to-server)
- `NEXTAUTH_SECRET` must be set

## Step 5 — Report

Output a summary:
```
✅ API build: PASS
✅ Web build: PASS
✅ tsconfigs: OK
⚠️  KEYCLOAK_CLIENT_SECRET: [match/mismatch status]
```

Only proceed with `git push` if all checks pass.
