# Trials — সংক্ষিপ্ত গাইড

## Option 1 (hosted / shared demo)

- প্রতি প্রোডাক্টের **নিজস্ব** API + Admin + Shop + DB (`*_demo`)
- Approve = সেই DB-তে `admins` row (role ADMIN), stack বন্ধ হয় না
- Freeze/Destroy = admin `is_active=0`

| Product | Shop | Admin | API | DB |
|---------|------|-------|-----|-----|
| Lifestyle | :5100 | :5174 | :9100 | `lifestyle_demo` |
| Fashion | :5101 | :5175 | :9101 | `fashion_demo` |
| Techshop | :5102 | :5176 | :9102 | `techshop_demo` |

URLs আসে `products.deploy_config.shared_demo_*` থেকে।

### AI test commands

```powershell
cd "d:\our product\trialvo-shop\trialvo-backend"
node scripts/smoke-per-product-demo.js
node scripts/e2e-opt1-all-products.js
```

### Manual UI path

1. CP FE http://localhost:8000 — Request trial (hosted)  
2. Admin panel — approve request  
3. Status page — shop/admin links + credentials  

## Option 2 (self-hosted)

- Installer ZIP + license agent  
- Local registry often `localhost:5300`  
- Details: `trialvo-shop/.agents/local-trial-testing.md`  
- Scripts: `test-pack-download.js`, `test-installer-local.js`, `test-opt2-admin-actions.js`

## Pay + checkout

- Pay healthy: http://localhost:8088/health  
- CP `.env`: `TRIALVO_PAY_BASE_URL=http://localhost:8088`  
- Full checkout E2E may need seeded pay merchants (see `trialvo-pay` DEMO_GUIDE / seed scripts)
