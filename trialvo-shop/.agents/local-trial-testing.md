# Trialvo — local Control Plane & trial scripts

Companion to `../products/product-1-lifestyle/.agents/trial-system-local.md` (image builds, Option 2 details).

## Quick start (every day)

```bash
# 1. MySQL Control Plane DB (once per machine boot if not already up)
cd trialvo-shop
docker compose -f docker-compose.local.yml up -d mysql

# 2. Per-product demos (Option 1) — one-time / keep running
docker compose -f deploy/shared-demo/docker-compose.yml up -d
# First boot only: seed all three demo DBs
cd trialvo-backend && node scripts/seed-shared-demo.js

# 3. Backend — .env MUST contain:
#    SHARED_DEMO_ENABLED=1
#    SHARED_DEMO_SHOP_URL=http://localhost:5100
#    SHARED_DEMO_ADMIN_URL=http://localhost:5174
#    SHARED_DEMO_API_URL=http://localhost:9100
#    SHARED_DEMO_DB_HOST=127.0.0.1
#    SHARED_DEMO_DB_PORT=3430
#    SHARED_DEMO_DB_USER=root
#    SHARED_DEMO_DB_PASSWORD=localdev2026
#    SHARED_DEMO_DB_NAME=lifestyle_demo
#    (Fashion/Tech URLs+DB come from product deploy_config)
cd trialvo-backend
npm install   # first time
node src/server.js

# 4. Frontend
cd ../trialvo-frontend
npm install   # first time
npm run dev
```

| URL | Service |
|-----|---------|
| http://localhost:5000/api/health | Control Plane API |
| http://localhost:8000 | Trialvo shop UI |
| http://localhost:5100 | Lifestyle demo shop |
| http://localhost:5174 | Lifestyle demo admin |
| http://localhost:9100 | Lifestyle demo API |
| http://localhost:5101 / :5175 / :9101 | Fashion shop / admin / API |
| http://localhost:5102 / :5176 / :9102 | Techshop shop / admin / API |
| localhost:3430 | Shared MySQL (`lifestyle_demo` / `fashion_demo` / `techshop_demo` + CP) |
| localhost:5433 | Postgres (Trialvo Pay only, optional) |

## Option 1 = shared demo (not per-trial Docker)

Approved **hosted** trials create an **ADMIN** on that product's demo DB (`lifestyle_demo` / `fashion_demo` / `techshop_demo`).
Expire / Destroy / Freeze **revoke that admin only** — they never run `docker compose down`.

See `deploy/shared-demo/README.md`.

## Can teammates run the same trial tests?

**Yes.** Scripts are in `trialvo-backend/scripts/`. Requirements:

1. Product repos under `../products/` (or set `LIFESTYLE_REPO`)
2. `lifestyle|fashion|techshop-*:trial` images built
3. Demo compose up + seeded; `SHARED_DEMO_ENABLED=1` on backend
4. Docker Desktop healthy (for demos + Option 2)

### Option 1 script (demo grant + revoke)

```bash
cd trialvo-backend
# PowerShell
$env:KEEP="1"   # optional: skip revoke
node scripts/test-approve-flow.js
```

Expects per-product URLs from `deploy_config`; does **not** create `var/trials/...` folders.

### Option 2 script (unchanged — needs `localhost:5055` registry + pushed images)

```bash
$env:KEEP="1"
node scripts/test-installer-local.js
```

### Backup / restore (Option 2 / legacy stacks)

```bash
$env:DOCKER_PROVISION="1"; $env:PROVISION_MODE="local"
node scripts/test-backup-restore.js
```

## UI path (no scripts)

1. http://localhost:8000 → product details → **Browse demo shop** (public, no login)
2. Request Option 1 trial → approve in admin CP
3. Status page shows shared shop/admin links + shared-demo disclaimer
4. Admin email = request email; password on status page (Lifestyle **ADMIN**, not SUPER_ADMIN)
5. Destroy grant → that email cannot login; shop stays up

## Script index

| Script | Role |
|--------|------|
| `test-approve-flow.js` | Option 1 shared demo ADMIN grant + revoke |
| `seed-shared-demo.js` | One-time SQL seed for shared demo MySQL |
| `test-installer-local.js` | Option 2 local registry installer |
| `test-backup-restore.js` | Backup/restore round-trip |
| `test-local-provision.js` | Lower-level provision smoke |
| `verify-opt2-backup.js` | Backup against existing Opt2 KEEP stack |
| `e2e-local-http.js` | Trialvo HTTP e2e |

## Do not

- Commit real SMTP keys or production JWT secrets  
- Force-push or wipe shared MySQL without team OK  
- Tear down shared-demo compose when destroying a single trial grant  
- Expect Option 1 to create per-email Docker projects anymore
