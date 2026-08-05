# Full stack start — AI MUST follow this order

User বলে **“run everything” / “সব চালাও” / trialvo + shop + pay + trials** → এই ফাইল **উপর থেকে নিচ** অনুসরণ করো।  
Root সবসময়: `d:\our product`

পূর্বশর্ত: Docker Desktop চালু, Node.js ইনস্টল, এই monorepo checkout করা।

---

## Phase 0 — Sanity

```powershell
cd "d:\our product"
Test-Path .agent, infra, trialvo-shop, trialvo-pay, products
docker info | Out-Null   # must succeed
```

---

## Phase 1 — MySQL (সব প্রোডাক্ট + CP)

```powershell
docker compose -f infra/docker-compose.yml up -d
docker exec trialvo-mysql mysqladmin ping -h127.0.0.1 -uroot -plocaldev2026 --silent
```

DB সিঙ্ক (timestamped backups):

```powershell
node .agent/scripts/db-sync-check.js all
# diff থাকলে টিমের নতুন dump টানতে:
node .agent/scripts/db-sync-check.js all --apply
```

Backup না থাকলে / DB খালি হলে একবার:

```powershell
cd trialvo-shop\trialvo-backend
node scripts/seed-shared-demo.js
cd ..\..
```

---

## Phase 2 — Product demo images (নেই থাকলে build)

```powershell
docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "lifestyle-api:trial|fashion-api:trial|techshop-api:trial"
```

মিসিং থাকলে [RUNBOOK.md](./RUNBOOK.md) §৪ অনুযায়ী ৯টা ইমেজ বিল্ড (`*-api|admin|shop:trial`)।

---

## Phase 3 — Per-product shops (Option 1 demos)

```powershell
docker compose -f trialvo-shop/deploy/shared-demo/docker-compose.yml up -d
docker ps --format "{{.Names}}" | Select-String "-demo-"
```

প্রত্যাশিত ৯টা: `lifestyle|fashion|techshop-demo-{api,admin,shop}`

Health:

| URL | Expect |
|-----|--------|
| http://localhost:5100 | 200 Lifestyle shop |
| http://localhost:5101 | 200 Fashion shop |
| http://localhost:5102 | 200 Techshop shop |
| http://localhost:5174 / 5175 / 5176 | 200 admins |
| http://localhost:9100/api/v1/products | 401 (API alive) |

---

## Phase 4 — Trialvo Pay

```powershell
cd trialvo-shop
docker compose -f docker-compose.local.yml up -d postgres redis trialvo-pay
# Host health (mapped port):
# http://localhost:8088/health  → 200
cd ..
```

নোট: compose-এর ভিতরে pay `:8080`, **হোস্ট থেকে `:8088`**।  
CP `.env`-এ `TRIALVO_PAY_BASE_URL=http://localhost:8088` (হোস্টে Node চালালে)।

Pay DB migration mismatch হলে local `trialvo_pay` DB রিসেট করে কন্টেইনার রিস্টার্ট (শুধু local)।

---

## Phase 5 — Control Plane (Trialvo shop marketplace)

```powershell
cd trialvo-shop\trialvo-backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Ensure critical keys (edit if missing):
#   DB_PORT=3430  DB_NAME=trialvo_shop
#   SHARED_DEMO_ENABLED=1
#   SHARED_DEMO_DB_PORT=3430
#   TRIALVO_PAY_BASE_URL=http://localhost:8088
npm install
node src/server.js
# other terminal:
cd ..\trialvo-frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

| URL | Expect |
|-----|--------|
| http://localhost:5000/api/health | 200 |
| http://localhost:8000 | 200 CP UI |
| http://localhost:5000/api/products | 200 catalog |

প্রোডাক্ট `deploy_config` পুরোনো হলে:

```powershell
cd trialvo-shop\trialvo-backend
node scripts/reseed-demo-product-urls.js
```

Admin login (local default — `.env` / seed অনুযায়ী): সাধারণত `admin@trialvo.com` (পাসওয়ার্ড টিম নোট / seed)।

---

## Phase 6 — Trials (Option 1 + smoke)

Opt1 = shared per-product demo-এ ADMIN grant (আলাদা Docker per email নয়)।

```powershell
cd trialvo-shop\trialvo-backend
node scripts/smoke-per-product-demo.js
node scripts/e2e-opt1-all-products.js
# optional multi-product request dedup:
node scripts/test-multi-product-trial.js
```

UI দিয়ে: http://localhost:8000 → প্রোডাক্ট → Request trial (hosted) → admin approve → status page-এ shop/admin URL।

Opt2 (self-hosted installer) আলাদা — registry `localhost:5300` + image push লাগে; বিস্তারিত `trialvo-shop/.agents/local-trial-testing.md`।

---

## Phase 7 — DB পরিবর্তন থাকলে (AI বাধ্যতামূলক)

Schema/seed/data বদলেছে →

```powershell
cd "d:\our product"
node .agent/scripts/db-backup.js <lifestyle|fashion|techshop|all>
git add products/*/Back` End/db-backup
# commit when user asks
```

---

## “Everything up” checklist (AI verify before saying done)

- [ ] `trialvo-mysql` healthy  
- [ ] ৯টা `*-demo-*` container Up  
- [ ] Pay `:8088/health` 200  
- [ ] CP `:5000` + FE `:8000` 200  
- [ ] `smoke-per-product-demo.js` PASS  
- [ ] (optional) `e2e-opt1-all-products.js` PASS  

কোনো ধাপ fail → থামো, error দেখাও, পরের ধাপে যেও না।

---

## আরও পড়া

- [RUNBOOK.md](./RUNBOOK.md) — everyday start/stop  
- [DB_BACKUP.md](./DB_BACKUP.md) — backup/restore/sync  
- [TRIALS.md](./TRIALS.md) — Opt1/Opt2 সংক্ষিপ্ত  
- [COMMANDS.md](./COMMANDS.md) — cheat sheet  
