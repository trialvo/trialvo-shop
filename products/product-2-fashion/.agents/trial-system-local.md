# Trial system — local Docker testing (teammates & AI agents)

Yes: a teammate **can run the same trial test scripts** you use, as long as the folder layout and prerequisites below match. Those scripts live in **`trialvo-shop`**, not inside Lifestyle alone.

## What “trial test” means

| Flow | What it proves | Script / UI |
|------|----------------|-------------|
| **Option 1 (hosted)** | Approve → Docker stack (db+api+admin+shop) → license unlock | UI request **or** `test-approve-flow.js` |
| **Option 2 (client-hosted)** | Installer compose + local registry + Go gate + Node commands | `test-installer-local.js` |
| **Backup / restore** | mysqldump → CP blob → restore | `test-backup-restore.js` |

Lifestyle is the **product image** (API / admin / shop / license-agent).  
Trialvo is the **Control Plane** that provisions and emails credentials.

## Required folder layout

Provisioner resolves Lifestyle via a relative path. Keep this structure:

```
<workspace>/
├── products/product-1-lifestyle/          ← Lifestyle (this repo)
└── trialvo-shop/                  ← Control Plane + scripts
    ├── trialvo-backend/
    ├── trialvo-frontend/
    └── docker-compose.local.yml   ← MySQL on host port 3307 (shop); Postgres 5433 (Pay only)
```

Optional override:

```bash
set LIFESTYLE_REPO=D:\path\to\products/product-1-lifestyle
```

## Prerequisites

| Tool | Why |
|------|-----|
| Docker Desktop | Trial stacks + images + (Option 2) local registry |
| Node 18+ | Control Plane + scripts |
| ~8–16 GB RAM free | Multiple MySQL/Node containers |
| Sibling `trialvo-shop` checkout | Scripts & MySQL Control Plane |

## One-time / infrequent setup

### A. Trialvo MySQL (Control Plane)

```bash
cd trialvo-shop
docker compose -f docker-compose.local.yml up -d mysql
# waits until healthy on localhost:3307
```

### B. Trialvo backend `.env`

Copy from teammate or use the shared local template. Must include:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3307
DB_USER=trialvo
DB_PASSWORD=localdev2026
DB_NAME=trialvo_shop
FRONTEND_URL=http://localhost:8000
CORS_ORIGIN=http://localhost:8000
JWT_SECRET=local-dev-jwt-secret-trialvo-2026

# Critical — without these, Option 1 emails fake demo URLs
DOCKER_PROVISION=1
PROVISION_MODE=local
```

```bash
cd trialvo-shop/trialvo-backend
npm install
```

### C. Build Lifestyle trial images (once, or after Dockerfile/UI changes)

From `products/product-1-lifestyle`:

```bash
# API (includes seed-trial.sh + mysql client)
cd "Back End"
docker build -t lifestyle-api:trial .

cd "../admin panel"
docker build -t lifestyle-admin:trial .

cd "../shop panel"
docker build -t lifestyle-shop:trial .

cd "../license-agent"
docker build -t lifestyle-license-agent:trial .
```

Option 2 also needs a local registry and pushes:

```bash
docker run -d --name trialvo-registry -p 5055:5000 registry:2
docker tag lifestyle-api:trial localhost:5055/lifestyle-api:trial
docker tag lifestyle-admin:trial localhost:5055/lifestyle-admin:trial
docker tag lifestyle-shop:trial localhost:5055/lifestyle-shop:trial
docker tag lifestyle-license-agent:trial localhost:5055/lifestyle-license-agent:trial
docker push localhost:5055/lifestyle-api:trial
docker push localhost:5055/lifestyle-admin:trial
docker push localhost:5055/lifestyle-shop:trial
docker push localhost:5055/lifestyle-license-agent:trial
```

## Every session: start Control Plane

Two terminals:

```bash
# Terminal 1 — API (must load .env with DOCKER_PROVISION=1)
cd trialvo-shop/trialvo-backend
node src/server.js
# → http://localhost:5000

# Terminal 2 — Shop UI
cd trialvo-shop/trialvo-frontend
npm install   # first time
npm run dev
# → http://localhost:8000
```

Health check: http://localhost:5000/api/health → `{"status":"ok",...}`

Trialvo admin (typical local seed): `admin@trialvo.com` / `Antor@123`  
(Confirm with your team if seed differs.)

## Way 1 — Test like a human (recommended first)

1. Open http://localhost:8000  
2. Request **Option 1 — Trialvo Hosted** with your real email  
3. Wait for provision (~1–3 min while Docker seeds MySQL)  
4. Check email **and** status page for Shop / Admin links + password  
5. Admin login = **the email you used on the request** (not `trial-…@trialvo.demo` anymore)  
6. Shop/Admin URLs look like `http://localhost:<randomPort>` — not `:5000` / `:5173`

If links are `localhost:5000` / `5173` and meta says `MVP: shared demo stack URLs`, **`DOCKER_PROVISION` was off** when CP started. Fix `.env`, restart `node src/server.js`, request again.

## Way 2 — Same automated scripts (QA / AI)

All from `trialvo-shop/trialvo-backend` with CP already on `:5000` and Docker up.

### Option 1 end-to-end (keep stack for manual click-through)

```bash
cd trialvo-shop/trialvo-backend
# Windows PowerShell
$env:KEEP="1"; $env:DOCKER_PROVISION="1"; $env:PROVISION_MODE="local"
node scripts/test-approve-flow.js
```

```bash
# Unix
KEEP=1 DOCKER_PROVISION=1 PROVISION_MODE=local node scripts/test-approve-flow.js
```

- Without `KEEP=1` the script **destroys** the stack when done.  
- With `KEEP=1`, read printed ports / check latest `trial_instances` row for URLs.

### Option 2 installer (local registry required)

```bash
KEEP=1 node scripts/test-installer-local.js
```

### Backup / restore round-trip

```bash
DOCKER_PROVISION=1 PROVISION_MODE=local node scripts/test-backup-restore.js
```

### Other helpers

| Script | Purpose |
|--------|---------|
| `scripts/test-local-provision.js` | Provisioner-only smoke |
| `scripts/verify-opt2-backup.js` | Backup on an existing KEEP=1 Option 2 stack |
| `scripts/e2e-local-http.js` | HTTP-level Trialvo e2e (admin login, etc.) |

## What teammates get vs what you get

| Capability | Same as yours? |
|------------|----------------|
| Run Lifestyle admin/shop/API locally | Yes — [setup-and-run.md](./setup-and-run.md) |
| Request Option 1 via UI + real Docker URLs | Yes — if CP `.env` has `DOCKER_PROVISION=1` |
| Run `test-approve-flow.js` / installer / backup scripts | Yes — same commands |
| Receive Brevo SMTP mail | Only if their CP SMTP is configured (or use status page creds) |
| Exact same ports as your machine | No — ports are allocated free each provision |

## Architecture reminders (trial)

- **Node embedded license client** inside Lifestyle API: heartbeat + backup/restore commands.  
- **Go license-agent**: lease-gate only (`:9099`), does **not** consume remote commands.  
- Admin runtime API URL: `/config.js` from env.  
- Shop runtime media URL: `window.__SHOP_CONFIG__` from layout (needs current `lifestyle-shop:trial` image).  
- Seed admin password: provisioner upserts the request email as `SUPER_ADMIN` into MySQL.

## Common failures

| Symptom | Fix |
|---------|-----|
| Shop/Admin links `:5000` / `:5173` | Enable `DOCKER_PROVISION=1`, restart CP, new request |
| `Docker daemon not available` | Start Docker Desktop; CP uses 45s `docker info` timeout |
| API `403 TRIAL_LOCKED` | Restart trial `api` after CP was down; wait for register/lease |
| Shop “No image” | Rebuild/push `lifestyle-shop:trial` with runtime `__SHOP_CONFIG__` + CSP `localhost:*` |
| Option 2 seed exit 1 | Use API image that includes `scripts/seed-trial.sh` (CRLF-safe) |
| Option 2 gate `ECONNREFUSED` | Go agent must bind `:9099` (all interfaces), not `127.0.0.1` only |

## Tear down a leftover trial stack

```bash
# Option 1 project dir example
docker compose -f "trialvo-shop/trialvo-backend/var/trials/trial-<id>/docker-compose.yml" down -v

# Option 2 temp installer
docker compose -f "%TEMP%/opt2-<id>/docker-compose.yml" down -v
```

## Related docs

- Lifestyle only: [setup-and-run.md](./setup-and-run.md)  
- Product plan: `our product/TRIAL_SYSTEM_PLAN.md`  
- Trialvo agent notes: `trialvo-shop/.agents/`
