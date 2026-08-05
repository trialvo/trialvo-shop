# Lifestyle E-Commerce — Local Setup (AI agents & teammates)

## Project overview

Monorepo with 3 apps + Docker MySQL:

```
products/product-1-lifestyle/
├── Back End/          → Express.js API (Node.js, CommonJS)
├── admin panel/       → Vite + React + TypeScript admin dashboard
├── shop panel/        → Next.js storefront
├── license-agent/     → Go lease-gate (used in trial Docker images)
├── LOCAL_SETUP.md     → Human-oriented quick start
└── .agents/           → You are here
```

## Architecture (local “dev” mode — not trial)

| Service | Port | Notes |
|---------|------|--------|
| Backend API | `9000` | `Back End/`, MySQL via `mysql2` |
| Shop panel | `5000` | Next.js; config in `shop panel/src/config/env.ts` |
| Admin panel | `5173` | Vite; can override API via `window.__APP_CONFIG__` in Docker |
| MySQL 8.4 | host `13306` → container `3306` | container `lifestyle-mysql` |
| phpMyAdmin | `8283` | container `lifestyle-phpmyadmin` |

> Trial instances use **different random host ports** and are started by **Trialvo**, not by this compose file. See [trial-system-local.md](./trial-system-local.md).

## Setup (follow in order)

### 1. Prerequisites

- Node.js 18+ (`node --version`)
- Docker Desktop running (`docker info`)
- npm (`npm --version`)

### 2. Start database

```bash
cd "Back End"
docker compose up -d
```

Expected:

- `lifestyle-mysql` → `13306:3306`
- `lifestyle-phpmyadmin` → `8283:80`

Wait ~15s for MySQL to accept connections.

### 3. Backend `.env`

```bash
cd "Back End"
cp .env.example .env    # Unix
copy .env.example .env  # Windows
```

Set at least:

```env
PORT=9000
ADMIN_URL=http://localhost:5173
SHOP_URL=http://localhost:5000
STORAGE_DRIVER=local
STORAGE_URL=http://localhost:9000
DB_HOST=127.0.0.1
DB_PORT=13306
DB_NAME=ecom
DB_USER=root
DB_PASSWORD=secret
```

### 4. Import demo DB

Dump: `Back End/db backup/myecomv2.sql` (~32MB)

**PowerShell:**

```powershell
Get-Content "Back End\db backup\myecomv2.sql" -Raw | docker exec -i lifestyle-mysql mysql -uroot -psecret ecom
```

**Bash:**

```bash
docker exec -i lifestyle-mysql mysql -uroot -psecret ecom < "Back End/db backup/myecomv2.sql"
```

### 5. Install dependencies

```bash
cd "Back End" && npm install
cd "../shop panel" && npm install
cd "../admin panel" && npm install
```

### 6. Start apps (3 terminals)

```bash
# Terminal 1 — API
cd "Back End" && npm run dev          # http://localhost:9000

# Terminal 2 — Shop
cd "shop panel" && npm run dev        # http://localhost:5000

# Terminal 3 — Admin
cd "admin panel" && npm run dev       # http://localhost:5173
```

phpMyAdmin: http://localhost:8283 — login `root` / `secret`.

## Key files

| File | Purpose |
|------|---------|
| `Back End/.env` | DB, ports, storage |
| `Back End/docker-compose.yml` | MySQL + phpMyAdmin |
| `shop panel/src/config/env.ts` | Shop URLs; trial uses `window.__SHOP_CONFIG__` |
| `admin panel/src/config/env.ts` | Admin URLs; trial uses `window.__APP_CONFIG__` / `/config.js` |

## Troubleshooting

**Container name in use**

```bash
docker rm -f lifestyle-mysql lifestyle-phpmyadmin
cd "Back End" && docker compose up -d
```

**Port busy (Windows)**

```powershell
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

**Backend `ECONNREFUSED`** — MySQL still starting; wait and restart nodemon (`rs`).

## Stop

```bash
# Ctrl+C in each Node terminal
cd "Back End"
docker compose down          # keep data
docker compose down -v       # wipe MySQL volume
```

## Notes for AI agents

1. Shop local config is in `env.ts` (`ACTIVE_ENV=auto` → `dev` when not production). Docker trials inject runtime config — do not assume build-time URLs.
2. Prefer working `.env` ports above over outdated comments in `.env.example` if they disagree.
3. Backend is CommonJS (`"type": "commonjs"`).
4. phpMyAdmin host port is **8283** (not 8282).
5. For Trialvo Option 1/2 local testing, leave this guide and open [trial-system-local.md](./trial-system-local.md).
