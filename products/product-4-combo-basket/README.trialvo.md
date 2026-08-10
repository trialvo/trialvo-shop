# Combo Basket — Trialvo integration

Fourth catalog product. Distinct stack from lifestyle/fashion/tech:

| Component | Path | Tech |
|-----------|------|------|
| API | `my-shop-api/` | Express 5 + Sequelize + MySQL |
| Admin | `my-shop-admin/` | React 19 + Vite 7 |
| Shop | `my-shop-shop/` | Next.js 16 standalone |

## Trialvo catalog

- Slug: `combo-basket-ecommerce`
- Shared demo DB: `combobasket_demo`
- Demo ports: shop `5103`, admin `5177`, API `9103`
- Option 1: shared demo on NEW VPS (same pattern as other products)
- Option 2: **Node/cPanel** installer (`installer_mode: node_only`) — no Go license-agent

## Local dev (original)

```bash
npm run install:all
npm run dev
```

API `:5001`, shop `:3000`, admin `:5173`.

## Docker trial images

```bash
../../scripts/ci/build-demo-images.sh combo
docker compose -f ../../trialvo-shop/deploy/shared-demo/docker-compose.yml up -d combobasket-api combobasket-admin combobasket-shop
```

## Demo admin (seed)

When `TRIAL_MODE=1`, API seeds `demo@trialvo.com` / `Trialvo@Demo123` (superadmin).

Trial customers get per-trial admins via Control Plane `sharedDemoProvisioner` (combo admin schema).
