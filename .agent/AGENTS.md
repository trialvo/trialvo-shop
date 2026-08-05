# Trialvo monorepo — Agent instructions

এই ফোল্ডার (`d:\our product\.agent`) টিম ও AI helper-এর জন্য **single source of truth**।  
প্রতিবার প্রজেক্ট চালু/সিঙ্ক/DB কাজের আগে এখান থেকে পড়ো।

## User বলে “run everything” হলে

**প্রথমেই পড়ো ও অনুসরণ করো:** [FULL_STACK_START.md](./FULL_STACK_START.md)

সেখানে ক্রমানুসারে আছে: MySQL → DB sync → demo images → ৯টা shop stack → Pay → Control Plane → Trial smoke।  
শেষে checklist verify না করে “done” বলো না।

## দ্রুত লিংক

| ডক | কাজ |
|----|-----|
| [FULL_STACK_START.md](./FULL_STACK_START.md) | **সব চালানোর master checklist** |
| [RUNBOOK.md](./RUNBOOK.md) | Everyday start/stop |
| [TRIALS.md](./TRIALS.md) | Opt1 / Opt2 trials |
| [DB_BACKUP.md](./DB_BACKUP.md) | DB backup / restore / sync |
| [COMMANDS.md](./COMMANDS.md) | কপি-পেস্ট কমান্ড |
| [scripts/](./scripts/) | `db-backup.js` / `db-restore.js` / `db-sync-check.js` |

## AI helper — বাধ্যতামূলক নিয়ম

1. **Workspace root** = `d:\our product` (monorepo)। Nested product `.git` নেই।
2. “Run everything” → [FULL_STACK_START.md](./FULL_STACK_START.md) phase 0→7। Skip করো না।
3. DB schema/data পরিবর্তন git দিয়ে ধরা যায় না → পরে **timestamped SQL backup** (`db-backup.js`)।
4. `git pull` / স্টার্টের পর: `node .agent/scripts/db-sync-check.js all` (প্রয়োজনে `--apply` বা `--backup`)।
5. প্রতি প্রোডাক্ট/DB-এ **সর্বশেষ ৩টা** dump (`DB_BACKUP_KEEP=3`)।
6. সিক্রেট কমিট করো না (`.env`, `firebase-adminsdk.json`, `credentials.txt`)।
7. Demo naming: `lifestyle|fashion|techshop-demo-{api,admin,shop}` + DB `*_demo`।
8. Pay host port **8088** (container 8080)। CP host-run হলে `TRIALVO_PAY_BASE_URL=http://localhost:8088`।

## কী কী “everything”-এ পড়ে

| Layer | কী |
|-------|-----|
| Infra | `trialvo-mysql` :3430, phpMyAdmin :8283 |
| Product demos | ৩× (API+Admin+Shop) = ৯ কন্টেইনার |
| Trialvo Pay | postgres + redis + `trialvo-pay` :8088 |
| Control Plane | backend :5000 + frontend :8000 |
| Trials | Opt1 smoke/E2E; Opt2 আলাদা registry workflow |

## প্রোডাক্ট ↔ DB

| Product key | Folder | Default DB | Extra DB |
|-------------|--------|------------|----------|
| `lifestyle` | `products/product-1-lifestyle` | `lifestyle_demo` | `lifestyle_ecom` |
| `fashion` | `products/product-2-fashion` | `fashion_demo` | `fashion_ecom` |
| `techshop` | `products/product-3-tech-shop` | `techshop_demo` | `techshop_ecom` |

Backup: `products/<product>/Back End/db-backup/<db>_<YYYYMMDD_HHMMSS>.sql`  
Legacy seed fallback: `Back End/db backup/myecomv2.sql`
