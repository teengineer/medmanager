# syntax=docker/dockerfile:1

# Bundan Var — single TanStack Start app (SSR + API in one process), served by
# apps/web/server.mjs. The database is remote PostgreSQL (Neon) via DATABASE_URL,
# so the container is stateless and needs no volume.

FROM node:22-slim

# pnpm via corepack (version pinned by the root package.json "packageManager")
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 1) Install deps first so this layer is cached unless the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=3000

# 2) Copy the source and build the web app -> apps/web/dist/{client,server}
COPY . .
RUN pnpm --filter web build
EXPOSE 3000

WORKDIR /app/apps/web

# server.mjs runs migrations + seed on startup (non-fatal), then starts the SSR/API server.
CMD ["pnpm", "start"]
