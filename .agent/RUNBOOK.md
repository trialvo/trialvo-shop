# Runbook — লোকাল সবকিছু চালানো

Root: `d:\our product`

## ১) একবার / মেশিন বুট

```powershell
cd "d:\our product"

# Shared MySQL (+ phpMyAdmin)
docker compose -f infra/docker-compose.yml up -d

# Per-product Option 1 demos (৯ কন্টেইনার)
docker compose -f trialvo-shop/deploy/shared-demo/docker-compose.yml up -d

# Pay deps + Trialvo Pay (পেমেন্ট টেস্ট করলে)
cd trialvo-shop
docker compose -f docker-compose.local.yml up -d postgres redis trialvo-pay
```

MySQL healthy না হলে থামো — বাকি সব DB এখানে।

## ২) DB সিঙ্ক (প্রতিদিন / git pull এর পর)

```powershell
cd "d:\our product"
node .agent/scripts/db-sync-check.js all
```

- Exit `0` = sync  
- Exit `2` = diff → সিদ্ধান্ত নাও:

```powershell
# রিপোর latest backup → লোকাল MySQL (টিমমেটের schema টানতে)
node .agent/scripts/db-sync-check.js all --apply

# লোকাল MySQL → নতুন timestamped backup (তোমার পরিবর্তন সেভ)
node .agent/scripts/db-sync-check.js all --backup
```

বিস্তারিত: [DB_BACKUP.md](./DB_BACKUP.md)

## ৩) Control Plane

```powershell
cd "d:\our product\trialvo-shop\trialvo-backend"
# .env এ SHARED_DEMO_ENABLED=1 এবং DB_PORT=3430 (infra MySQL)
node src/server.js

cd "d:\our product\trialvo-shop\trialvo-frontend"
npm run dev
```

| URL | সার্ভিস |
|-----|---------|
| http://localhost:5000/api/health | CP API |
| http://localhost:8000 | CP frontend |
| http://localhost:5100 / 5174 / 9100 | Lifestyle shop / admin / API |
| http://localhost:5101 / 5175 / 9101 | Fashion |
| http://localhost:5102 / 5176 / 9102 | Techshop |
| http://localhost:8088/health | Trialvo Pay |
| http://localhost:3430 | MySQL |
| http://localhost:8283 | phpMyAdmin |

## ৪) ইমেজ না থাকলে (প্রথম সেটআপ)

```powershell
cd "d:\our product\products\product-1-lifestyle"
docker build -t lifestyle-api:trial "Back End"
docker build -t lifestyle-admin:trial "admin panel"
docker build -t lifestyle-shop:trial "shop panel"

cd "..\product-2-fashion"
docker build -t fashion-api:trial "Back End"
docker build -t fashion-admin:trial "admin panel"
docker build -t fashion-shop:trial "shop panel"

cd "..\product-3-tech-shop"
docker build -t techshop-api:trial "Back End"
docker build -t techshop-admin:trial "admin panel"
docker build -t techshop-shop:trial "shop panel"
```

Demo DB খালি হলে:

```powershell
cd "d:\our product\trialvo-shop\trialvo-backend"
node scripts/seed-shared-demo.js
```

## ৫) বন্ধ করা

```powershell
cd "d:\our product\trialvo-shop"
docker compose -f deploy/shared-demo/docker-compose.yml down
# Pay বন্ধ (ঐচ্ছিক)
docker compose -f docker-compose.local.yml stop trialvo-pay postgres redis
# MySQL সাধারণত চালু রাখো; পুরো বন্ধ:
cd "d:\our product"
docker compose -f infra/docker-compose.yml down
```
