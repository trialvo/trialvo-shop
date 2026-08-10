# 🧺 Combo Basket — Monorepo

একটি **monorepo**-তে তিনটি অ্যাপ্লিকেশন পরিচালিত হয়:

| App          | Tech              | Domain                  | Folder           |
| ------------ | ----------------- | ----------------------- | ---------------- |
| 🛒 **Shop**  | Next.js 16        | `combobasket.com`       | `my-shop-shop/`  |
| 🛠️ **Admin** | React + Vite      | `admin.combobasket.com` | `my-shop-admin/` |
| ⚙️ **API**   | Node.js + Express | `api.combobasket.com`   | `my-shop-api/`   |

---

## 🚀 CI/CD — GitHub Actions → cPanel

প্রতিটি অ্যাপের জন্য আলাদা GitHub Actions workflow আছে। শুধুমাত্র সেই অ্যাপের ফাইল পরিবর্তন হলেই সেটি auto-deploy হবে।

### Workflow Files

```
.github/workflows/
├── deploy-api.yml        # API deploy → api.combobasket.com
├── deploy-admin.yml      # Admin deploy → admin.combobasket.com
└── deploy-shop.yml       # Shop deploy → combobasket.com
```

### Trigger Logic (Path-Based)

```yaml
# শুধু my-shop-api/ পরিবর্তন হলেই API deploy হবে
paths:
  - "my-shop-api/**"

# শুধু my-shop-admin/ পরিবর্তন হলেই Admin deploy হবে
paths:
  - "my-shop-admin/**"

# শুধু my-shop-shop/ পরিবর্তন হলেই Shop deploy হবে
paths:
  - "my-shop-shop/**"
```

---

## 🔐 GitHub Secrets Setup (একবারই করতে হবে)

GitHub Repository → **Settings → Secrets and variables → Actions → New repository secret**

### সব Secret একনজরে (মাত্র ৮টি)

| Secret Name          | মান                                       | কে ব্যবহার করে   |
| -------------------- | ----------------------------------------- | ---------------- |
| `FTP_SERVER`         | cPanel FTP server hostname                | API, Admin, Shop |
| `SSH_HOST`           | Server IP address                         | API, Shop        |
| `SSH_USERNAME`       | cPanel username                           | API, Shop        |
| `SSH_PASSWORD`       | cPanel password                           | API, Shop        |
| `API_FTP_USERNAME`   | API FTP account username                  | API              |
| `API_FTP_PASSWORD`   | API FTP account password                  | API              |
| `ADMIN_FTP_USERNAME` | Admin FTP account username                | Admin            |
| `ADMIN_FTP_PASSWORD` | Admin FTP account password                | Admin            |
| `SHOP_FTP_USERNAME`  | Shop FTP account username                 | Shop             |
| `SHOP_FTP_PASSWORD`  | Shop FTP account password                 | Shop             |
| `API_ENV`            | **API-র পুরো `.env` file content**        | API build        |
| `ADMIN_ENV`          | **Admin-র পুরো `.env` file content**      | Admin build      |
| `SHOP_ENV`           | **Shop-র পুরো `.env.local` file content** | Shop build       |

> **💡 `API_ENV` / `ADMIN_ENV` / `SHOP_ENV` কীভাবে দেবেন:**
> নিচের মতো করে `.env` file-এর পুরো content copy করে GitHub Secret-এ paste করুন:
>
> ```
> NODE_ENV=production
> DB_HOST=localhost
> DB_NAME=combo_basket_db
> ...
> ```

---

## 📋 cPanel Setup Guide (একবার করতে হবে)

### Step 1: FTP Accounts তৈরি করুন

cPanel → **FTP Accounts** → তিনটি আলাদা account তৈরি করুন:

```
FTP User 1: api_deploy      → Directory: /api.combobasket.com
FTP User 2: admin_deploy    → Directory: /admin.combobasket.com
FTP User 3: shop_deploy     → Directory: /combobasket.com
```

### Step 2: API — Node.js App Setup

cPanel → **Setup Node.js App**:

```
Node.js version : 20.x (or latest LTS)
Application mode: Production
Application root: api.combobasket.com
Application URL : api.combobasket.com
Startup file    : src/server.js
```

**Environment Variables** (Node.js App section-এ):

```env
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://combobasket.com,https://admin.combobasket.com
```

### Step 3: Shop — Node.js App Setup

cPanel → **Setup Node.js App**:

```
Node.js version : 20.x
Application mode: Production
Application root: combobasket.com
Application URL : combobasket.com
Startup file    : server.js
```

**Environment Variables**:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://api.combobasket.com/api
NEXT_PUBLIC_IMAGE_BASE_URL=https://api.combobasket.com
NEXT_PUBLIC_SITE_URL=https://combobasket.com
```

### Step 4: Admin — Static Files (কোনো Node.js App লাগবে না)

Admin হলো Vite দিয়ে built static files। cPanel এ শুধু:

- `admin.combobasket.com` document root-এ static files রাখলেই হবে
- FTP দিয়ে `dist/` folder-এর contents সরাসরি upload হবে

---

## 🔄 Deploy Flow (কীভাবে কাজ করে)

```
git push origin main
        │
        ├─ my-shop-api/ changed?   → deploy-api.yml runs
        │      └── FTP upload → SSH restart Node.js app
        │
        ├─ my-shop-admin/ changed? → deploy-admin.yml runs
        │      └── npm run build → FTP upload dist/
        │
        └─ my-shop-shop/ changed?  → deploy-shop.yml runs
               └── npm run build → FTP upload .next/standalone/ → SSH restart
```

---

## 🛠️ Local Development

```bash
# সব dependencies install করুন
npm install
npm run install:all

# সব তিনটি app একসাথে চালু করুন
npm run dev

# আলাদা আলাদা চালু করুন
npm run backend    # API: http://localhost:5000
npm run admin      # Admin: http://localhost:5173
npm run shop       # Shop: http://localhost:3000
```

---

## 📁 Project Structure

```
my-shop/
├── .github/
│   └── workflows/
│       ├── deploy-api.yml        # API CI/CD
│       ├── deploy-admin.yml      # Admin CI/CD
│       └── deploy-shop.yml       # Shop CI/CD
│
├── my-shop-api/                  # Node.js + Express Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── admin/            # Admin controllers
│   │   │   └── shop/             # Shop controllers
│   │   ├── models/               # Sequelize models
│   │   ├── routes/               # Express routes
│   │   └── middleware/           # Auth, upload middleware
│   ├── uploads/                  # Uploaded images (gitignored)
│   └── .env                      # Environment variables (gitignored)
│
├── my-shop-admin/                # React + Vite Admin Panel
│   ├── src/
│   │   ├── pages/                # Admin pages
│   │   ├── components/           # Reusable components
│   │   └── api/                  # API client functions
│   └── dist/                     # Build output (gitignored)
│
└── my-shop-shop/                 # Next.js 16 Shop Frontend
    ├── src/
    │   ├── app/                  # App Router pages
    │   ├── components/           # React components
    │   └── api/                  # API client functions
    └── .next/                    # Build output (gitignored)
```

---

## 🌿 Git Branch Strategy

```
main    → Production (auto-deploy to combobasket.com)
dev     → Development / Testing (no auto-deploy)
feature/xxx → Feature branches (PR to dev)
```

**Workflow:**

```
feature/my-feature → dev (PR & review) → main (auto-deploy)
```

---

## 🔑 Manual Deploy (যেকোনো সময়)

GitHub → **Actions** → Workflow নির্বাচন করুন → **Run workflow** → Branch: `main` → **Run**

---

## ⚠️ Important Notes

1. **`.env` files কখনো Git-এ push করবেন না** — সবসময় cPanel Node.js App এর Environment Variables-এ রাখুন
2. **`uploads/` folder** — cPanel-এ manually তৈরি করুন, GitHub-এ track হয় না
3. **Database migrations** — প্রথমবার API deploy করার পর SSH দিয়ে `npm run seed` run করুন
4. **SSL Certificate** — cPanel → SSL/TLS → Let's Encrypt দিয়ে সব domain-এ HTTPS চালু করুন

---

## 🆘 Troubleshooting

| সমস্যা               | সমাধান                                                          |
| -------------------- | --------------------------------------------------------------- |
| FTP upload fail      | cPanel FTP credentials এবং directory permissions চেক করুন       |
| API restart হচ্ছে না | cPanel → Node.js Apps → Restart manually                        |
| Shop 500 error       | SSH → log files চেক করুন                                        |
| Image load হচ্ছে না  | `uploads/` folder exists কিনা এবং permissions 755 কিনা চেক করুন |

---

_এই project Combo Basket e-commerce platform এর জন্য তৈরি।_
