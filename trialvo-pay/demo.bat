@echo off
REM ============================================================
REM  Trialvo Pay Demo Setup — One-Click Test Environment
REM  Run this script to start everything needed for a client demo
REM ============================================================

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║         Trialvo Pay — Demo Environment Setup        ║
echo  ╚══════════════════════════════════════════════════╝
echo.

REM --- Step 1: Check Docker ---
echo [1/5] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Docker is not running! Please start Docker Desktop first.
    pause
    exit /b 1
)
echo  ✅ Docker is running

REM --- Step 2: Start PostgreSQL + Redis ---
echo.
echo [2/5] Starting PostgreSQL ^& Redis...
docker compose up -d 2>nul || docker-compose up -d 2>nul
timeout /t 5 /nobreak >nul
echo  ✅ Database services started

REM --- Step 3: Build ^& Start Trialvo Pay ---
echo.
echo [3/5] Building ^& starting Trialvo Pay (this may take 1-2 minutes on first run)...
start "Trialvo Pay Server" cmd /c "cargo run 2>&1 | findstr /V DEBUG"
echo  ⏳ Waiting for Trialvo Pay to start...
:wait_trialvo_pay
timeout /t 3 /nobreak >nul
curl -s http://localhost:8080/health >nul 2>&1
if %errorlevel% neq 0 goto wait_trialvo_pay
echo  ✅ Trialvo Pay is running on http://localhost:8080

REM --- Step 4: Start Test E-Commerce ---
echo.
echo [4/5] Starting Test E-Commerce Shop...
start "Test E-Commerce" cmd /c "node examples\test-ecom\server.js"
timeout /t 3 /nobreak >nul
echo  ✅ Test Shop is running on http://localhost:3456

REM --- Step 5: Auto-configure Test Service ---
echo.
echo [5/5] Configuring test service credentials...
curl -s -X POST http://localhost:3456/api/config -H "Content-Type: application/json" -d "{\"serviceId\":\"fbd43229-7298-4ca1-9d6f-648619eb639a\",\"apiKey\":\"e7e57de54d29fc9f45d1f803414a08b692b7936cd3c40f5703fe07b6e5a1f0bb\",\"ipnSecret\":\"eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc\"}" >nul
echo  ✅ Test service configured

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║              🎉 DEMO READY!                      ║
echo  ╠══════════════════════════════════════════════════╣
echo  ║                                                  ║
echo  ║  ADMIN PANEL:    http://localhost:8080/admin      ║
echo  ║    Email:    admin@pay.trialvo.com           ║
echo  ║    Password: admin123                             ║
echo  ║                                                  ║
echo  ║  MERCHANT PANEL: http://localhost:8080/merchant   ║
echo  ║    Email:    merchant@test.com                    ║
echo  ║    Password: Merchant123!                         ║
echo  ║                                                  ║
echo  ║  TEST SHOP:      http://localhost:3456            ║
echo  ║    (Pre-configured, ready to checkout)            ║
echo  ║                                                  ║
echo  ║  API DOCS:       http://localhost:8080/docs       ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Press any key to open all panels in your browser...
pause >nul

start http://localhost:8080/admin
timeout /t 1 /nobreak >nul
start http://localhost:8080/merchant
timeout /t 1 /nobreak >nul
start http://localhost:3456
