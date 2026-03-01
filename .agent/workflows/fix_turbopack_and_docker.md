---
description: Fix Next.js stale cache errors (CSS metadata) and restart Docker
---

# Fix Next.js Cache & Docker

If Next.js throws CSS parsing errors or reports "file not found" for generated `.next/types` after switching branches/configuration, or if Docker containers fail to start, use this workflow to reset the environment.

// turbo-all

1. Stop the NextJS & NestJS dev server processes if running
2. run*command: `Get-Process | Where-Object { $*.CommandLine -like "_next dev_" -or $\_.CommandLine -like "_nest start_" } | Stop-Process -Force -ErrorAction SilentlyContinue`
3. Remove Next.js and Turbo caches in the web app
4. run_command: `Remove-Item -Path "c:\Users\green\GB Ferry App\apps\web\.next" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "c:\Users\green\GB Ferry App\apps\web\.turbo" -Recurse -Force -ErrorAction SilentlyContinue`
5. Restart Docker containers
6. run_command: `cd "c:\Users\green\GB Ferry App"; docker-compose down; docker-compose up -d`
7. Re-generate Prisma Client (if schema changed or cache corrupted)
8. run_command: `cd "c:\Users\green\GB Ferry App"; pnpm dlx prisma generate --schema=./packages/database/prisma/schema.prisma`
9. Validate Docker containers
10. run_command: `docker ps --format "table {{.Names}}\t{{.Status}}"`
11. Restart Next.js Web App in the background
12. run_command: `cd "c:\Users\green\GB Ferry App"; $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User"); pnpm turbo dev --filter=@gbferry/web`
