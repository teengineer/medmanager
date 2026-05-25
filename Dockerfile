# syntax=docker/dockerfile:1

# Bundan Var — single TanStack Start app (SSR + API in one process), served by
# apps/web/server.mjs. The database is remote libsql (Turso) via DATABASE_URL,
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

# 2) Copy the source and build the web app -> apps/web/dist/{client,server}
COPY . .
RUN pnpm --filter web build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/web

# Apply DB migrations + seed the use-case catalog (idempotent), then start the
# combined SSR/API server. db:migrate runs against DATABASE_URL (Turso).
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
