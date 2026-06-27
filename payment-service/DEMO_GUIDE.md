# PayVault — Demo & Testing Guide

## Quick Start (One Command)

```batch
demo.bat
```

This script will:
1. ✅ Verify Docker is running
2. ✅ Start PostgreSQL & Redis
3. ✅ Build & start PayVault server
4. ✅ Start the test e-commerce shop
5. ✅ Auto-configure all credentials
6. ✅ Open all panels in your browser

---

## All URLs & Credentials

### 🔧 Admin Panel — `http://localhost:8080/admin`
Full system management: services, API keys, IPN webhooks, transactions, refunds, system config.

| Field    | Value                         |
|----------|-------------------------------|
| Email    | `admin@payvault.trialvo.com`  |
| Password | `admin123`                    |

### 🏪 Merchant Panel — `http://localhost:8080/merchant`
Merchant-facing dashboard: transactions, bills, analytics.

| Field    | Value              |
|----------|--------------------|
| Email    | `merchant@test.com`|
| Password | `Merchant123!`     |

### 🛒 Test E-Commerce Shop — `http://localhost:3456`
Simulated online store that integrates with PayVault to test the complete payment flow.

**Pre-configured with these service credentials:**

| Field              | Value |
|--------------------|-------|
| Service ID         | `fbd43229-7298-4ca1-9d6f-648619eb639a` |
| API Key            | `e7e57de54d29fc9f45d1f803414a08b692b7936cd3c40f5703fe07b6e5a1f0bb` |
| IPN Webhook Secret | `eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc` |

### 📖 Developer Docs — `http://localhost:8080/docs`
API documentation for integration partners.

---

## Demo Flow for Client Presentation

### Step 1: Show Admin Panel
1. Login to **Admin Panel** → Show the dashboard
2. Go to **Services** → Show the test-ecom service
3. Go to **System Config** → Show EPS gateway configuration
4. Show **API Key management** and **IPN Webhook setup**

### Step 2: Show Test Shop (Customer Flow)
1. Open **Test E-Commerce Shop** at `http://localhost:3456`
2. Settings should be pre-configured (if not, paste credentials from table above)
3. Go to **Shop** tab → Add products to cart
4. Fill customer details → Click **Checkout**
5. PayVault payment page opens → Shows order summary, countdown timer
6. Click **Pay Now** → Redirects to **EPS Sandbox Payment Gateway**
7. Select a payment method (bKash, Nagad, Card, etc.)
8. Complete sandbox payment

### Step 3: Show Payment Events
1. After payment, go to **Events** tab in Test Shop → Shows real-time IPN webhooks
2. Go to **Orders** tab → See bill status updated (success/failed/cancelled)
3. Go back to **Admin Panel** → Show transaction details in Transactions page
4. Demonstrate **refund** from Admin Panel

### Step 4: Show Merchant Panel
1. Login to **Merchant Panel** → Show merchant's view
2. Show transaction history, filtering by status
3. Show bill details and payment timeline

---

## Payment Scenarios to Test

| Scenario | How to Test |
|----------|-------------|
| ✅ **Successful Payment** | Complete checkout → Pay via EPS sandbox → Should redirect to success URL |
| ❌ **Failed Payment** | Complete checkout → Cancel on EPS page → Should redirect to fail URL |
| 🚫 **Cancelled Payment** | Complete checkout → Close EPS page or click cancel → Status becomes cancelled |
| ⏰ **Expired Payment** | Create a bill and wait 30 minutes → Status auto-expires |
| 💸 **Refund** | After successful payment → Go to Admin Panel → Transactions → Click Refund |
| 🔔 **IPN Webhook** | After any payment event → Check Events tab in Test Shop for real-time notifications |

---

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Test E-Commerce   │────▶│   PayVault API   │────▶│  EPS Sandbox     │
│   localhost:3456     │     │   localhost:8080  │     │  (Real Gateway)  │
│                     │◀────│                  │◀────│                  │
│  • Shop + Cart      │ IPN │  • Bill Creation │     │  • bKash/Nagad   │
│  • Checkout Form    │     │  • Payment Init  │     │  • Card Payments │
│  • Event Viewer     │     │  • Status Verify │     │  • Internet Bank │
└─────────────────────┘     │  • IPN Delivery  │     └──────────────────┘
                            │  • Admin Panel   │
                            │  • Merchant Panel│
                            │  • API Docs      │
                            └──────────────────┘
                                    │
                            ┌───────┴───────┐
                            │  PostgreSQL   │
                            │  + Redis      │
                            │  (Docker)     │
                            └───────────────┘
```

---

## Prerequisites

- **Docker Desktop** — for PostgreSQL & Redis
- **Rust** (cargo) — for building PayVault
- **Node.js** — for the test e-commerce server
- **Git** — for version control

---

## Manual Start (if demo.bat doesn't work)

```bash
# 1. Start Docker services
docker compose up -d

# 2. Start PayVault (in terminal 1)
cargo run

# 3. Start Test Shop (in terminal 2)
node examples/test-ecom/server.js

# 4. Configure test service (in terminal 3)
curl -X POST http://localhost:3456/api/config \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"fbd43229-7298-4ca1-9d6f-648619eb639a","apiKey":"e7e57de54d29fc9f45d1f803414a08b692b7936cd3c40f5703fe07b6e5a1f0bb","ipnSecret":"eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc"}'
```

---

## Stopping Everything

```bash
# Stop PayVault & Test Shop — close the terminal windows, or:
taskkill /IM payvault.exe /F 2>nul
taskkill /IM node.exe /F 2>nul

# Stop Docker services
docker compose down
```
