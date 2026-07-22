# Trialvo — local Control Plane & trial scripts

Companion to `product 1 life style/.agents/trial-system-local.md` (image builds, Option 1/2 details).

## Quick start (every day)

```bash
# 1. Postgres (once per machine boot if not already up)
cd trialvo-shop
docker compose -f docker-compose.local.yml up -d postgres

# 2. Backend — .env MUST contain:
#    DOCKER_PROVISION=1
#    PROVISION_MODE=local
cd trialvo-backend
npm install   # first time
node src/server.js

# 3. Frontend
cd ../trialvo-frontend
npm install   # first time
npm run dev
```

| URL | Service |
|-----|---------|
| http://localhost:5000/api/health | Control Plane API |
| http://localhost:8000 | Trialvo shop UI |
| localhost:5433 | Postgres |

## Can teammates run the same trial tests?

**Yes.** Scripts are in `trialvo-backend/scripts/`. Requirements:

1. Sibling checkout: `../product 1 life style` (or set `LIFESTYLE_REPO`)
2. `lifestyle-*:trial` images built (see Lifestyle `.agents/trial-system-local.md`)
3. This backend running with `DOCKER_PROVISION=1`
4. Docker Desktop healthy

### Option 1 script (leave stack up)

```bash
cd trialvo-backend
# PowerShell
$env:KEEP="1"; $env:DOCKER_PROVISION="1"; $env:PROVISION_MODE="local"
node scripts/test-approve-flow.js
```

### Option 2 script (needs `localhost:5055` registry + pushed images)

```bash
$env:KEEP="1"
node scripts/test-installer-local.js
```

### Backup / restore

```bash
$env:DOCKER_PROVISION="1"; $env:PROVISION_MODE="local"
node scripts/test-backup-restore.js
```

## UI path (no scripts)

1. http://localhost:8000 → request Option 1 trial  
2. Wait for Docker provision  
3. Use status page / email links (`localhost:<port>`, not demo `:5000`/`:5173`)  
4. Admin email = request email; password on status page  

## Script index

| Script | Role |
|--------|------|
| `test-approve-flow.js` | Option 1 provision + unlock (+ destroy unless `KEEP=1`) |
| `test-installer-local.js` | Option 2 local registry installer |
| `test-backup-restore.js` | Backup/restore round-trip |
| `test-local-provision.js` | Lower-level provision smoke |
| `verify-opt2-backup.js` | Backup against existing Opt2 KEEP stack |
| `e2e-local-http.js` | Trialvo HTTP e2e |

## Do not

- Commit real SMTP keys or production JWT secrets  
- Force-push or wipe shared Postgres without team OK  
- Expect identical host ports across machines (they are dynamic)
