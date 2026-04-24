# Deploying medmanager API

The API is shipped as a Docker image and runs behind Caddy (HTTPS) with Litestream streaming the SQLite DB to S3-compatible storage.

## One-time server setup (Linux)

1. Install Docker + Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER   # log out/in after this
   ```
2. Point your DNS `A` record (e.g. `api.medmanager.example.com`) at the server's public IP.
3. Clone this folder only:
   ```bash
   git clone --filter=blob:none --sparse https://github.com/youruser/medmanager.git
   cd medmanager && git sparse-checkout set deploy
   cd deploy
   cp .env.example .env
   # edit .env: API_DOMAIN, JWT_SIGNING_KEY, S3 creds
   ```
4. Authenticate with GHCR so you can pull the private image (skip if public):
   ```bash
   echo $GHCR_TOKEN | docker login ghcr.io -u youruser --password-stdin
   ```
5. Pull + start:
   ```bash
   docker compose pull
   docker compose up -d
   ```
6. Verify:
   ```bash
   curl -v https://api.medmanager.example.com/health
   ```

## Updating

CI (`.github/workflows/ci.yml`) builds and pushes `ghcr.io/<owner>/medmanager-api:latest` on every push to `main`. On the server:

```bash
cd /path/to/medmanager/deploy
docker compose pull api && docker compose up -d api
```

Or install [Watchtower](https://containrrr.dev/watchtower/) to automate this.

## Backup + restore

Litestream streams `/data/medmanager.db` to S3 continuously. To restore on a fresh server:

```bash
docker run --rm -v sqlite-data:/data \
  -e LITESTREAM_ACCESS_KEY_ID=... -e LITESTREAM_SECRET_ACCESS_KEY=... \
  -v $(pwd)/litestream.yml:/etc/litestream.yml:ro \
  litestream/litestream restore -config /etc/litestream.yml /data/medmanager.db
```

Then `docker compose up -d`.

## Firewall

Only expose 22 (SSH, key auth only), 80, 443:

```bash
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
```
