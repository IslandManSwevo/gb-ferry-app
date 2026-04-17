FROM node:20-alpine AS base

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/dto ./packages/dto

# Copy web app
COPY apps/web ./apps/web

# Install dependencies and build web app
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @gbferry/web build

# Change ownership and switch to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["pnpm", "--filter", "@gbferry/web", "start"]
