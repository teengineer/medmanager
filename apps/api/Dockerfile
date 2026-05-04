# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
RUN pnpm install --frozen-lockfile --filter @medmanager/api...

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @medmanager/api build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -S medmanager && adduser -S medmanager -G medmanager && mkdir -p /data && chown -R medmanager:medmanager /data
USER medmanager

COPY --from=build --chown=medmanager:medmanager /app/apps/api/dist ./dist
COPY --from=build --chown=medmanager:medmanager /app/apps/api/drizzle ./drizzle
COPY --from=build --chown=medmanager:medmanager /app/apps/api/package.json ./package.json
COPY --from=build --chown=medmanager:medmanager /app/apps/api/node_modules ./node_modules

ENV DATABASE_URL=file:/data/medmanager.db

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
