# Per-product Option 1 demos

Each product runs its own **API + Admin + Shop** against a separate database on the shared MySQL container (`trialvo-mysql` :3430).

## Naming

| Product | DB | Shop | Admin | API | Containers |
|---------|----|------|-------|-----|------------|
| Lifestyle | `lifestyle_demo` | :5100 | :5174 | :9100 | `lifestyle-demo-{api,admin,shop}` |
| Fashion | `fashion_demo` | :5101 | :5175 | :9101 | `fashion-demo-{api,admin,shop}` |
| Techshop | `techshop_demo` | :5102 | :5176 | :9102 | `techshop-demo-{api,admin,shop}` |

Images: `lifestyle-*:trial`, `fashion-*:trial`, `techshop-*:trial`.

## Prerequisites

```bash
# Infra MySQL
docker compose -f infra/docker-compose.yml up -d

# Images (from each product repo)
cd products/product-1-lifestyle
docker build -t lifestyle-api:trial "Back End"
docker build -t lifestyle-admin:trial "admin panel"
docker build -t lifestyle-shop:trial "shop panel"

cd ../product-2-fashion
docker build -t fashion-api:trial "Back End"
docker build -t fashion-admin:trial "admin panel"
docker build -t fashion-shop:trial "shop panel"

cd ../product-3-tech-shop
docker build -t techshop-api:trial "Back End"
docker build -t techshop-admin:trial "admin panel"
docker build -t techshop-shop:trial "shop panel"
```

## Start

```bash
cd trialvo-shop
docker compose -f deploy/shared-demo/docker-compose.yml up -d
```

## Seed (once per DB)

```bash
cd trialvo-backend
node scripts/seed-shared-demo.js
# or: node scripts/seed-shared-demo.js fashion_demo techshop_demo
```

## Control Plane `.env`

```env
SHARED_DEMO_ENABLED=1
SHARED_DEMO_SHOP_URL=http://localhost:5100
SHARED_DEMO_ADMIN_URL=http://localhost:5174
SHARED_DEMO_API_URL=http://localhost:9100
SHARED_DEMO_DB_HOST=127.0.0.1
SHARED_DEMO_DB_PORT=3430
SHARED_DEMO_DB_USER=root
SHARED_DEMO_DB_PASSWORD=localdev2026
SHARED_DEMO_DB_NAME=lifestyle_demo
```

Per-product URLs/DB come from each product's `deploy_config` (`shared_demo_*` keys), not only these defaults.

## Access model

- Each approved Option 1 trial gets **ADMIN** (`role_id=2`) on **that product's** demo DB.
- Expire / Destroy / Freeze = deactivate that admin only — **never** `docker compose down`.
