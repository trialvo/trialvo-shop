# DB backup workflow

MySQL schema/data git-এ সরাসরি track হয় না। তাই প্রতিটি প্রোডাক্টের  
`Back End/db-backup/` ফোল্ডারে **timestamped `.sql` dump** রাখা হয়।

## ফাইল নাম

```text
products/product-1-lifestyle/Back End/db-backup/
  lifestyle_demo_20260806_031415.sql
  lifestyle_demo_20260806_031415.sql.sha256
  latest-lifestyle_demo.json
```

- ফরম্যাট: `<database>_<YYYYMMDD_HHMMSS>.sql`
- প্রতিটি dump-এর সাথে `.sha256`
- `latest-<database>.json` → AI/স্ক্রিপ্টের জন্য পॉয়েন্টার
- **প্রতি DB-তে সর্বশেষ ৩টা** রাখা হয় (পুরোনো অটো-ডিলিট)

Default DB = Option 1 demo (`lifestyle_demo` / `fashion_demo` / `techshop_demo`).  
লোকাল app DB চাইলে `--db lifestyle_ecom` বা `--db all`।

## AI / মানুষ — কমান্ড

### ব্যাকআপ নাও (পরিবর্তনের পর)

```powershell
cd "d:\our product"

# এক প্রোডাক্ট (default demo DB)
node .agent/scripts/db-backup.js lifestyle
node .agent/scripts/db-backup.js fashion
node .agent/scripts/db-backup.js techshop

# সব প্রোডাক্টের default DB
node .agent/scripts/db-backup.js all

# দুই DB-ই (demo + ecom)
node .agent/scripts/db-backup.js lifestyle --db all
```

এরপর dump + `latest-*.json` **git commit** করো যাতে টিম পায়।

### Latest পড়ে apply (রিস্টোর)

```powershell
node .agent/scripts/db-restore.js lifestyle
node .agent/scripts/db-restore.js fashion --db fashion_demo
node .agent/scripts/db-restore.js all
node .agent/scripts/db-restore.js techshop --file "Back End/db-backup/techshop_demo_20260806_120000.sql"
```

Timestamped backup না থাকলে legacy `db backup/myecomv2.sql` fallback।

### Latest vs live compare (+ অটো অ্যাকশন)

```powershell
# শুধু রিপোর্ট (diff থাকলে exit 2)
node .agent/scripts/db-sync-check.js all

# রিপোর latest → MySQL (লোকাল পুরোনো হলে)
node .agent/scripts/db-sync-check.js all --apply

# MySQL → নতুন backup (লোকাল এগিয়ে থাকলে)
node .agent/scripts/db-sync-check.js fashion --backup
```

## AI সিদ্ধান্ত টেবিল

| পরিস্থিতি | কমান্ড |
|-----------|--------|
| Schema/migration/seed লোকালে বদলেছ | `db-backup.js <product>` তারপর commit |
| `git pull` এর পর DB মিলছে না | `db-sync-check.js all --apply` |
| কেউ জিজ্ঞাসা করে “latest DB নাও” | `db-backup.js all` |
| কেউ জিজ্ঞাসা করে “latest apply করো” | `db-restore.js all` বা `db-sync-check.js all --apply` |
| শুধু ৩টার বেশি রাখতে চাও না | স্ক্রিপ্ট অটো prune করে; `DB_BACKUP_KEEP=5` দিয়ে বাড়ানো যায় |

## প্রয়োজনীয় runtime

- Docker চালু, কন্টেইনার `trialvo-mysql` healthy  
- `infra/docker-compose.yml up -d`  
- Env (optional): `MYSQL_CONTAINER`, `SHARED_DEMO_DB_*`, `DB_BACKUP_KEEP`

## Git নোট

- `db-backup/*.sql` **কমিট করো** (এটাই DB changelog)।  
- `firebase-adminsdk.json` / `.env` কমিট করো না।  
- বড় dump এড়াতে প্রতি DB-তে ৩টার বেশি রাখো না।
