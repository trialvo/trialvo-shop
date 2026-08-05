# 🚀 Local Development Setup Guide

> **Everything you need to get the Lifestyle project running locally.**
> Estimated time: ~10 minutes.

---

## 📋 Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org) |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

> ⚠️ **Docker Desktop must be running** before you start. Open it and wait until the engine is ready.

---

## 📁 Project Structure

```
products/product-1-lifestyle/
├── Back End/          → Express.js API server (port 9000)
├── admin panel/       → Vite + React admin dashboard (port 5173)
├── shop panel/        → Next.js storefront (port 5000)
└── LOCAL_SETUP.md     → You are here!
```

---

## ⚡ Quick Start (Step by Step)

### Step 1: Start Docker Containers (MySQL + phpMyAdmin)

```powershell
cd "Back End"
docker compose up -d
```

This starts:
- **MySQL 8.4** → `localhost:13306` (container: `lifestyle-mysql`)
- **phpMyAdmin** → `http://localhost:8282` (container: `lifestyle-phpmyadmin`)

✅ **Verify:** Open http://localhost:8282 — you should see the phpMyAdmin login page.

> Login: `root` / `secret`

---

### Step 2: Create the Backend `.env` File

```powershell
cd "Back End"
copy .env.example .env
```

Then open `.env` and update these values:

```env
PORT=9000
ADMIN_URL=http://localhost:5173
SHOP_URL=http://localhost:5000
STORAGE_URL=http://localhost:9000

DB_HOST=127.0.0.1
DB_PORT=13306
DB_NAME=ecom
DB_USER=root
DB_PASSWORD=secret
```

> 💡 Most values in `.env.example` are already correct. The key ones to double-check are `PORT`, `ADMIN_URL`, `SHOP_URL`, and `STORAGE_URL`.

---

### Step 3: Import the Database

Wait ~10 seconds after `docker compose up` for MySQL to fully initialize, then:

**PowerShell:**
```powershell
Get-Content "Back End\db backup\myecomv2.sql" -Raw | docker exec -i lifestyle-mysql mysql -uroot -psecret ecom
```

**CMD / Git Bash:**
```bash
docker exec -i lifestyle-mysql mysql -uroot -psecret ecom < "Back End/db backup/myecomv2.sql"
```

> ⏳ This imports ~32MB of data. It may take 30-60 seconds. You'll know it's done when the command returns with no errors.

✅ **Verify:** Open http://localhost:8282, select the `ecom` database — you should see tables.

---

### Step 4: Install Dependencies

Run `npm install` in each project folder:

```powershell
cd "Back End"
npm install

cd "..\shop panel"
npm install

cd "..\admin panel"
npm install
```

> 💡 If `node_modules` folders already exist, you can skip this step.

---

### Step 5: Start All Services

Open **3 separate terminals** and run one command in each:

**Terminal 1 — Backend API:**
```powershell
cd "Back End"
npm run dev
```

**Terminal 2 — Shop Panel:**
```powershell
cd "shop panel"
npm run dev
```

**Terminal 3 — Admin Panel:**
```powershell
cd "admin panel"
npm run dev
```

---

## 🌐 Access Points

Once everything is running:

| Service | URL | What it is |
|---------|-----|------------|
| **Backend API** | http://localhost:9000 | Express.js REST API |
| **Shop Panel** | http://localhost:5000 | Customer-facing storefront |
| **Admin Panel** | http://localhost:5173 | Admin dashboard |
| **phpMyAdmin** | http://localhost:8282 | Database management UI |

---

## 🛑 Stopping Everything

**Stop the Node.js servers:** Press `Ctrl+C` in each terminal.

**Stop Docker containers:**
```powershell
cd "Back End"
docker compose down
```

> Add `-v` flag to also delete the database volumes (⚠️ this deletes all DB data):
> ```powershell
> docker compose down -v
> ```

---

## 🔥 Common Issues

### `container name "/lifestyle-mysql" is already in use`
```powershell
docker rm -f lifestyle-mysql lifestyle-phpmyadmin
docker compose up -d
```

### `ECONNREFUSED 127.0.0.1:13306`
MySQL container isn't ready yet. Wait 10-15 seconds and restart the backend:
```powershell
# In the backend terminal, type:
rs
# (nodemon will restart)
```

### Port already in use
Another process is using the port. Find and kill it:
```powershell
# Find what's using port 9000
netstat -ano | findstr :9000
# Kill the process (replace PID with the actual number)
taskkill /PID <PID> /F
```

### `npm install` fails on Windows
Try deleting `node_modules` and the lock file, then reinstall:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 📝 Notes

- The **shop panel** config is hardcoded in `shop panel/src/config/env.ts`. In `dev` mode it automatically points to `localhost:9000` for the API. No `.env` file needed for shop panel.
- The **admin panel** connects to `localhost:9000` by default in dev mode.
- The **backend** reads all config from `Back End/.env`.
- The database backup file is at `Back End/db backup/myecomv2.sql`.
