# Bundan Var

Installable PWA for household medicine inventory. Track expiry dates, get reminders
before things go bad, and at the doctor's office pull up what you already have so
they don't re-prescribe.

Turkish and English UI. Turkey-first market.

## Stack

Single full-stack app — SSR pages and the API run in one Node process.

- **App** (`apps/web`): [TanStack Start](https://tanstack.com/start) (React 19 + TanStack Router + TanStack Query) + Tailwind v4 + `react-i18next`
- **Backend**: server functions + API routes under `src/routes/api/`, [Drizzle ORM](https://orm.drizzle.team) + libsql (SQLite local / Turso remote)
- **Auth**: [Better Auth](https://better-auth.com) — email/password + Google OAuth
- **Web Push**: `web-push` (VAPID)
- **Runtime**: Node 22, single process via `apps/web/server.mjs`
- **Deploy**: Docker → [Dokploy](https://dokploy.com) (see [`DEPLOY.md`](./DEPLOY.md))

## Prerequisites

- Node.js 22+
- pnpm 10+
- (Optional) Docker for container deployment

## Getting started

```bash
pnpm install
pnpm db:migrate              # creates apps/web/bundanvar.db, applies schema, seeds 50 use-cases
pnpm dev                     # http://localhost:5173 — SSR + API combined
```

Copy `apps/web/.env.example` → `apps/web/.env.local` and fill in values for
production-like config (Turso, Better Auth secret, Google OAuth, web push).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the dev server (SSR + API) |
| `pnpm build` | Build to `apps/web/dist/{client,server}` |
| `pnpm start` | Run the production server (`server.mjs`) after build |
| `pnpm typecheck` | Typecheck |
| `pnpm lint` | Lint |
| `pnpm test` | Run the test suite (vitest) |
| `pnpm db:generate` | Regenerate the Drizzle migration after schema changes |
| `pnpm db:migrate` | Apply migrations + seed |
| `pnpm db:studio` | Open Drizzle Studio |

## Repo layout

```
apps/
  web/                 TanStack Start app (SSR + API in one process)
    src/routes/        file-based routes; API under src/routes/api/
    src/db/            Drizzle schema + libsql client + seed
    drizzle/           committed migration SQL
    server.mjs         production entry (static + SSR/API fetch handler)
Dockerfile             build + run image (Node 22, pnpm)
docker-compose.yml     app + daily expiry-cron sidecar
DEPLOY.md              Dokploy deployment guide
.github/workflows/     CI — typecheck, lint, test, build, docker build
```

## Deployment

Docker, deployed to Dokploy with a remote Turso database. Full instructions in
[`DEPLOY.md`](./DEPLOY.md).

## License

Personal project. Source code: <https://github.com/teengineer/medmanager>
