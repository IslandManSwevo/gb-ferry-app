---
name: think-first
description: Pre-implementation context gatherer. Run this before starting any code change to understand the current state, find reuse opportunities, and surface risks. Enforces the "think before act" discipline.
user-invocable: false
---

Before writing a single line of code, you MUST complete this checklist. Do not skip steps.

## Step 1 — Read the files being changed

Read the actual current content of every file you plan to modify. Do not rely on memory or assume you know what's there. The codebase changes frequently.

## Step 2 — Check CLAUDE.md

Read `C:\Users\green\GB Ferry App\CLAUDE.md` if you haven't already this session. Confirm:
- Which layer you're working in (API / web / database / dto)
- The relevant module or route structure
- Any known failure patterns in the "Common Railway Failures" table that could apply

## Step 3 — Find what already exists

Before creating anything new, search for:
- Existing components in `apps/web/src/components/` that could be extended rather than replaced
- Existing API client methods in `apps/web/src/lib/api/client.ts` — don't add duplicate calls
- Existing NestJS services/modules that already handle the domain

Report what you found that can be reused.

## Step 4 — Check design system compliance (for UI work)

If the task involves frontend UI, confirm the planned approach:
- Uses `#050505` background, `#33FF33` phosphor glow
- Uses `rounded-none` (zero border-radius everywhere)
- Uses `font-mono` for any data/telemetry values
- Follows the 8px spacing grid
- Does NOT use Ant Design components in new code (migration in progress)

If you would violate any rule, state it now and propose the compliant alternative before proceeding.

## Step 5 — Identify risks

List any risks before touching the code:
- Schema changes (Prisma) that require `db:push` or migration
- Env vars referenced that may differ between local and Railway
- Keycloak client/role dependencies
- Breaking changes to exported DTO types used by other packages
- TypeScript strict mode issues that could surface

## Step 6 — State your plan in 3–5 bullet points

Write a concise implementation plan. Only then begin coding.
