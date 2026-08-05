@echo off
REM ============================================================
REM  Trialvo Pay Demo Setup — One-Click Local Test Environment
REM ============================================================

setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo  ================================================
echo       Trialvo Pay — Demo Environment Setup
echo  ================================================
echo.

REM --- Step 1: Check Docker ---
echo [1/6] Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Docker is not running. Start Docker Desktop first.
    pause
    exit /b 1
)
echo  OK Docker is running

REM --- Step 2: Start PostgreSQL + Redis (dev compose) ---
echo.
echo [2/6] Starting PostgreSQL ^& Redis...
docker compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo  ERROR: Failed to start docker-compose.dev.yml
    pause
    exit /b 1
)

echo  Waiting for database to be ready...
set /a _tries=0
:wait_db
set /a _tries+=1
if %_tries% GTR 60 (
    echo  ERROR: Postgres did not become ready in time.
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
docker exec payvault-dev-postgres pg_isready -U payvault >nul 2>&1
if errorlevel 1 goto wait_db
echo  OK Database services started

REM --- Step 3: Seed demo data ---
echo.
echo [3/6] Seeding demo data...
docker exec -i payvault-dev-postgres psql -U payvault -d payvault < seed_demo.sql >nul 2>&1
echo  OK Demo data seeded

REM --- Step 4: Build ^& Start Trialvo Pay ---
echo.
echo [4/6] Building ^& starting Trialvo Pay (first run may take a few minutes)...
start "Trialvo Pay Server" cmd /c "cargo run"
echo  Waiting for Trialvo Pay to start on :8080...
set /a _tries=0
:wait_pay
set /a _tries+=1
if %_tries% GTR 120 (
    echo  ERROR: Trialvo Pay did not start in time. Check the cargo window.
    pause
    exit /b 1
)
timeout /t 3 /nobreak >nul
curl -s http://localhost:8080/health >nul 2>&1
if errorlevel 1 goto wait_pay
echo  OK Trialvo Pay is running on http://localhost:8080

REM --- Step 5: Test E-Commerce ---
echo.
echo [5/6] Starting Test E-Commerce Shop...
if not exist "examples\test-ecom\node_modules" (
    echo  Installing npm dependencies...
    pushd examples\test-ecom
    call npm install
    popd
)
start "Test E-Commerce" cmd /c "node examples\test-ecom\server.js"
timeout /t 3 /nobreak >nul
echo  OK Test Shop is running on http://localhost:3456

REM --- Step 6: Configure test shop ---
echo.
echo [6/6] Configuring test service credentials...
curl -s -X POST http://localhost:3456/api/config -H "Content-Type: application/json" -d "{\"serviceId\":\"fbd43229-7298-4ca1-9d6f-648619eb639a\",\"apiKey\":\"e7e57de54d29fc9f45d1f803414a08b692b7936cd3c40f5703fe07b6e5a1f0bb\",\"ipnSecret\":\"eb410d012dc57424a97fe154ee839fea1ceecc67f0fc6af872084711cb9ad4dc\"}" >nul
echo  OK Test service configured

echo.
echo  ================================================
echo                   DEMO READY
echo  ================================================
echo.
echo   ADMIN:     http://localhost:8080/admin
echo              admin@payvault.trialvo.com / admin123
echo.
echo   MERCHANT:  http://localhost:8080/merchant
echo              merchant@test.com / Merchant123!
echo.
echo   TEST SHOP: http://localhost:3456
echo   DOCS:      http://localhost:8080/docs
echo.
echo  Press any key to open panels in your browser...
pause >nul

start http://localhost:8080/admin
timeout /t 1 /nobreak >nul
start http://localhost:8080/merchant
timeout /t 1 /nobreak >nul
start http://localhost:3456

endlocal
