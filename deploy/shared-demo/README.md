# Shared Lifestyle demo (Option 1)

One long-lived stack. Trial requesters get **ADMIN** accounts on this demo — we do **not** spin a Docker project per email.

## Ports

| Service | URL |
|---------|-----|
| Shop (public) | http://localhost:5100 |
| Admin | http://localhost:5174 |
| API | http://localhost:9100 |
| MySQL | localhost:23307 (root / `sharedDemoRoot2026`) |

> Host MySQL uses **23307** (not 13307) because Windows Hyper-V often reserves the 13262–13661 range.

## Prerequisites

Build Lifestyle trial images once from `product 1 life style`:

```bash
docker build -t lifestyle-api:trial "Back End"
docker build -t lifestyle-admin:trial "admin panel"
docker build -t lifestyle-shop:trial "shop panel"
```

## Start

```bash
cd trialvo-shop
docker compose -f deploy/shared-demo/docker-compose.yml up -d
```

## Seed (once)

```bash
cd trialvo-backend
node scripts/seed-shared-demo.js
```

Imports demo SQL + trial schema and creates ops SUPER_ADMIN if configured.

## Control Plane `.env`

```env
SHARED_DEMO_ENABLED=1
SHARED_DEMO_SHOP_URL=http://localhost:5100
SHARED_DEMO_ADMIN_URL=http://localhost:5174
SHARED_DEMO_API_URL=http://localhost:9100
SHARED_DEMO_DB_HOST=127.0.0.1
SHARED_DEMO_DB_PORT=23307
SHARED_DEMO_DB_USER=root
SHARED_DEMO_DB_PASSWORD=sharedDemoRoot2026
SHARED_DEMO_DB_NAME=ecom
```

## Access model

- Ops keeps the long-lived **SUPER_ADMIN** from seed.
- Each approved Option 1 trial gets Lifestyle **ADMIN** (`role_id=2`).
- Expire / Destroy / Freeze = deactivate that admin only — **never** `docker compose down`.
