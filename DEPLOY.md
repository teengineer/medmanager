# Deploying Bundan Var to Dokploy

Bundan Var is a single [TanStack Start](https://tanstack.com/start) app (`apps/web`)
that serves SSR pages **and** the API from one Node process (`server.mjs`). The
database is remote PostgreSQL ([Neon](https://neon.tech)), so the container is
stateless — no volumes required.

The repo ships a root **`Dockerfile`** (build + run) and a **`docker-compose.yml`**
(app + a daily cron sidecar). Pick whichever Dokploy deployment type you prefer.

---

## 1. Prerequisites

1. **Neon database** — create a project at <https://console.neon.tech> and copy
   the pooled connection string (`postgresql://...-pooler...neon.tech/...?sslmode=require`)
   → `DATABASE_URL`.

2. **Secrets**

   ```bash
   openssl rand -base64 32                 # BETTER_AUTH_SECRET
   openssl rand -hex 32                    # CRON_SECRET
   npx web-push generate-vapid-keys        # PUSH_PUBLIC_KEY / PUSH_PRIVATE_KEY (optional)
   ```

3. **(Optional) Google OAuth** — create credentials at
   <https://console.cloud.google.com/apis/credentials> and add the redirect URI
   `https://bundanvar.ilg.az/api/auth/callback/google`.

---

## 2. Environment variables

Set these on the Dokploy service (Environment tab). See `.env.example` for the
full template.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string (pooled endpoint) |
| `BETTER_AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Public origin, e.g. `https://bundanvar.ilg.az` (no trailing slash) |
| `WEB_ORIGIN` | ✅ | Same as `BETTER_AUTH_URL` |
| `CRON_SECRET` | ✅* | Guards `/api/cron/expiry`; required for the expiry notifier |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ⬜ | Enables Google sign-in |
| `PUSH_SUBJECT` / `PUSH_PUBLIC_KEY` / `PUSH_PRIVATE_KEY` | ⬜ | Enables web push |
| `PORT` | ⬜ | Defaults to `3000` (the image sets this) |

> The container runs `pnpm db:migrate` on every start, which applies Drizzle
> migrations and seeds the 50 use-cases. Both steps are idempotent.

---

## 3a. Deploy as a Dokploy **Application** (recommended)

1. **Create → Application**, source = this Git repository, branch `main`.
2. **Build Type → Dockerfile**, Dockerfile path `Dockerfile` (repo root).
3. Add the environment variables from the table above.
4. **Domains** → add your domain and set the container port to **`3000`**.
   Enable HTTPS (Let's Encrypt).
5. **Deploy.**
6. **Expiry cron** — add a Dokploy **Schedule** (cron `0 9 * * *`) that runs:

   ```bash
   curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://bundanvar.ilg.az/api/cron/expiry
   ```

## 3b. Deploy as a Dokploy **Compose**

1. **Create → Compose**, source = this Git repository.
2. Compose path `docker-compose.yml`.
3. Add the environment variables (Dokploy injects them into the services).
4. Point your domain at the `app` service, port **`3000`**.
5. **Deploy.** The bundled `cron` sidecar handles the daily expiry notifier — no
   separate schedule needed. (Remove the `ports:` mapping from the `app` service
   if Dokploy's Traefik is fronting it.)

---

## 4. Verify

```bash
curl https://bundanvar.ilg.az/api/health      # -> {"status":"ok"}
```

Then open the domain, register an account, and confirm the use-case list is
populated (proves migrations + seed ran).

---

## 5. Local Docker test (optional)

```bash
cp .env.example .env        # fill in Neon + secrets
docker compose up --build
# open http://localhost:3000
```

---

## Notes

- **No volume needed** — all data lives in Neon.
- `netlify.toml` and `apps/web/netlify/` are leftovers from the previous Netlify
  setup and are ignored by Docker (see `.dockerignore`). Safe to delete if you
  only deploy via Dokploy.
- Google OAuth and Web Push are optional; leave their env vars empty to disable.
