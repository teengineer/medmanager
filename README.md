# MedManager

Installable PWA for household medicine inventory. Track expiry dates, get reminders before things go bad, and at the doctor's office pull up what you already have so they don't re-prescribe.

Turkish and English UI. Turkey-first market.

## Stack

- **Web** (`apps/web`): React + Vite + TanStack Router + TanStack Query + Tailwind + `vite-plugin-pwa` + `react-i18next`
- **API** (`apps/api`): Hono + Drizzle ORM + SQLite (via libsql, Turso-compatible) + bcryptjs + jose (JWT) + web-push
- **Auth**: email/password + Google OAuth (implicit flow, no server secret)
- **Deploy**: Netlify for web, self-hosted Docker for API (or Railway/Fly.io)

## Prerequisites

- Node.js 22+
- pnpm 10+
- (Optional) Docker for container deployment

## Getting started

```bash
pnpm install
pnpm api:migrate              # creates medmanager.db, seeds 50 use-cases

# Two terminals
pnpm dev                      # web → http://localhost:5173
pnpm api:dev                  # api → http://localhost:5080
```

Copy `apps/api/.env.example` → `apps/api/.env` for production-like config.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run web dev server |
| `pnpm api:dev` | Run API with watch mode |
| `pnpm test` | Run API test suite (vitest) |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm build` | Build everything |
| `pnpm api:generate` | Regenerate drizzle migration after schema changes |
| `pnpm api:migrate` | Apply migrations + seed |

## Repo layout

```
apps/
  web/                 Vite + React PWA
  api/                 Hono + Drizzle TypeScript API
  api-dotnet-archive/  Previous .NET 10 + FastEndpoints version (reference only)
packages/
  shared-types/        Reserved for future shared types
deploy/                Dockerfile, compose, Caddy, Litestream config
.github/workflows/     CI — install, test, build, push Docker image to GHCR
```

## Deployment

See [`deploy/README.md`](./deploy/README.md) for three topologies:

- **A** — Web on Netlify + API self-hosted Docker on a Linux VPS (recommended, cheapest, most control)
- **B** — API on Railway or Fly.io, web on Netlify (no-ops)
- **C** — Everything on Netlify with Turso (serverless, needs small app tweaks)

## License

Personal project. Source code: <https://github.com/teengineer/medmanager>
