# Deploying MedManager

**Architecture:** Node.js API (Hono + Drizzle + SQLite/Turso) + static PWA (Vite build).

Two supported topologies below. Pick one.

---

## Topology A — Web on Netlify + API self-hosted (recommended)

### Web (Netlify, free)
1. Push repo to GitHub.
2. Netlify → **Add new site → Import from Git** → select the repo.
3. `apps/web/netlify.toml` handles the build config automatically.
4. Set env var in Netlify dashboard: `VITE_API_BASE_URL=https://api.yourdomain.com`
5. Done — static PWA deploys on every push to `main`.

### API (self-hosted Docker on any Linux VPS)

One-time server setup:
1. Install Docker on your Linux box:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # re-login after this
   ```
2. Point DNS `A` record (e.g. `api.yourdomain.com`) at the server's IP.
3. Clone just the `deploy/` folder:
   ```bash
   git clone --filter=blob:none --sparse https://github.com/teengineer/medmanager.git
   cd medmanager && git sparse-checkout set deploy
   cd deploy
   cp .env.example .env
   # edit .env: API_DOMAIN, WEB_ORIGIN (your Netlify URL), JWT_SIGNING_KEY, S3 creds
   ```
4. Authenticate with GHCR (only if private):
   ```bash
   echo $GHCR_TOKEN | docker login ghcr.io -u teengineer --password-stdin
   ```
5. Pull + start:
   ```bash
   docker compose pull
   docker compose up -d
   ```
6. Verify:
   ```bash
   curl -v https://api.yourdomain.com/health
   ```

CI builds and pushes `ghcr.io/teengineer/medmanager-api:latest` on every push to `main`. Update the server:
```bash
cd /path/to/medmanager/deploy && docker compose pull api && docker compose up -d api
```
Or install [Watchtower](https://containrrr.dev/watchtower/) to automate.

### Backup + restore (Litestream → S3)
Litestream streams `/data/medmanager.db` to S3-compatible storage continuously.
Restore on a fresh server:
```bash
docker run --rm -v sqlite-data:/data \
  -e LITESTREAM_ACCESS_KEY_ID=... -e LITESTREAM_SECRET_ACCESS_KEY=... \
  -v $(pwd)/litestream.yml:/etc/litestream.yml:ro \
  litestream/litestream restore -config /etc/litestream.yml /data/medmanager.db
```

### Firewall (ufw)
```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
```

---

## Topology B — Single Node process on Railway/Fly.io (simplest)

If you don't want two targets, deploy the API to Railway or Fly and the web to Netlify separately.

### Railway
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Select repo, set **Root directory** = `.` and **Dockerfile** = `apps/api/Dockerfile`.
3. Add Volume: mount at `/data` for SQLite persistence.
4. Env vars: `JWT_SIGNING_KEY`, `CORS_ORIGINS`, `PUSH_*` (if needed).
5. Deploy → get public URL → put in Netlify's `VITE_API_BASE_URL`.

### Fly.io
```bash
cd apps/api
flyctl launch --dockerfile ./Dockerfile --no-deploy
flyctl volumes create sqlite_data --size 1 --region ist
# edit fly.toml: mount volume at /data
flyctl secrets set JWT_SIGNING_KEY=$(openssl rand -base64 48)
flyctl deploy
```

---

## Topology C — Turso (serverless DB) + Netlify Functions

If you want _everything_ on Netlify (no VPS), migrate SQLite → Turso and wrap the API in a Netlify Function.
Requires small app changes (export `fetch` handler for Netlify adapter). Currently the app runs a long-lived Node process with local SQLite; moving to fully-serverless is possible but not pre-wired. Ask for this if you want it.
