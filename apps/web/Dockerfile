FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/dto ./packages/dto

# Copy web app
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web app
# We skip type checking in the docker build for speed if needed, but let's do a full build
RUN pnpm --filter @gbferry/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@gbferry/web", "start"]
