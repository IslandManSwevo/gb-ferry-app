FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/database ./packages/database
COPY packages/dto ./packages/dto

# Copy api app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @gbferry/database db:generate

# Build the api
RUN pnpm --filter @gbferry/api build

EXPOSE 3001

CMD ["pnpm", "--filter", "@gbferry/api", "start:prod"]
