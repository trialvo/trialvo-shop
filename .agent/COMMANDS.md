# Commands cheat sheet

**Full stack:** follow [FULL_STACK_START.md](./FULL_STACK_START.md) in order.

সব কমান্ড monorepo root থেকে:

```powershell
cd "d:\our product"
```

## Infra + demos

```powershell
docker compose -f infra/docker-compose.yml up -d
docker compose -f trialvo-shop/deploy/shared-demo/docker-compose.yml up -d
docker compose -f trialvo-shop/docker-compose.local.yml up -d postgres redis trialvo-pay
```

## DB backup / restore / sync

```powershell
# Backup (timestamped, keep last 3)
node .agent/scripts/db-backup.js lifestyle
node .agent/scripts/db-backup.js fashion
node .agent/scripts/db-backup.js techshop
node .agent/scripts/db-backup.js all
node .agent/scripts/db-backup.js lifestyle --db all

# Restore latest
node .agent/scripts/db-restore.js lifestyle
node .agent/scripts/db-restore.js all
node .agent/scripts/db-restore.js fashion --db fashion_ecom

# Compare live ↔ latest backup
node .agent/scripts/db-sync-check.js all
node .agent/scripts/db-sync-check.js all --apply
node .agent/scripts/db-sync-check.js all --backup
```

## Control Plane

```powershell
cd trialvo-shop\trialvo-backend
node src/server.js

cd ..\trialvo-frontend
npm run dev
```

## Smoke

```powershell
cd trialvo-shop\trialvo-backend
node scripts/smoke-per-product-demo.js
node scripts/e2e-opt1-all-products.js
```

## Env knobs

| Variable | Default |
|----------|---------|
| `MYSQL_CONTAINER` | `trialvo-mysql` |
| `SHARED_DEMO_DB_HOST` | `127.0.0.1` |
| `SHARED_DEMO_DB_PORT` | `3430` |
| `SHARED_DEMO_DB_USER` | `root` |
| `SHARED_DEMO_DB_PASSWORD` | `localdev2026` |
| `DB_BACKUP_KEEP` | `3` |
