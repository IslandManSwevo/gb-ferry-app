FROM node:20-alpine AS base

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/database ./packages/database
COPY packages/dto ./packages/dto

# Copy api app
COPY apps/api ./apps/api

# Install dependencies, generate Prisma client, and build api
RUN pnpm install --frozen-lockfile && \
    pnpm --filter @gbferry/database db:generate && \
    pnpm --filter @gbferry/api build

# Change ownership and switch to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["pnpm", "--filter", "@gbferry/api", "start:prod"]
