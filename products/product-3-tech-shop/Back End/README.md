# Graduate Fashion API

Backend API for the Graduate Fashion e-commerce platform.

## What This Service Does
- Auth and user/admin account APIs
- Product, category, brand, variation APIs
- Order, payment, coupon, delivery APIs
- Announcement and subscriber APIs
- Image upload and serving

## Key Files
- `index.js`: server setup, routes, global limiter, uploads serving/proxy
- `config/ApplicationSettings.js`: env loading and app config
- `utils/connection.js`: MySQL connection pool (local host or Cloud SQL socket)
- `helpers/img.js`: image processing and save flows
- `service/storage.js`: storage adapter (`local` or `gcs`)
- `docker-compose.yml`: local MySQL + phpMyAdmin
- `Dockerfile`: production image build
- `cloudbuild.yaml`: Cloud Build + Cloud Run deployment

## 1. Local Setup (Easy Path)

### 1.1 Prerequisites
Install:
1. Node.js 18+
2. Docker Desktop
3. Git

### 1.2 Clone and open
```powershell
git clone <your-repo-url>
cd gcp_graduatefashion_api
```

### 1.3 Create local env
```powershell
copy .env.example .env
```

Minimum local values in `.env`:
```env
NODE_ENV=development
PORT=7000
BASE_URL=/api/v1

DB_HOST=127.0.0.1
DB_NAME=ecom
DB_USER=root
DB_PASSWORD=secret
CONNECTION_LIMIT=10

STORAGE_DRIVER=local
STORAGE_URL=http://localhost:7000
```

### 1.4 Start database services
```powershell
docker compose up -d
```

Services:
- MySQL: `localhost:3306`
- phpMyAdmin: `http://localhost:8081`

### 1.5 Import database
1. Open `http://localhost:8081`
2. Login:
   - Server: `db`
   - User: `root`
   - Password: `secret`
3. Create database `ecom` (or match `DB_NAME`)
4. Import SQL dump, recommended:
   - `scripts/shoplink_myecomhandover.sql`

### 1.6 Run backend
```powershell
npm install
npm run dev
```

Test endpoint:
- `http://localhost:7000/api/v1/config/getSystemConfig`

## 2. Local Docker Commands (Quick Reference)

### Start local DB stack
```powershell
docker compose up -d
```

### Stop local DB stack
```powershell
docker compose down
```

### Stop and remove volumes (full reset)
```powershell
docker compose down -v
```

### Build API image
```powershell
docker build -t graduate-fashion-api .
```

### Run API image locally
```powershell
docker run --rm -p 8080:8080 --env-file .env -e PORT=8080 graduate-fashion-api
```

## 3. Upload Behavior

### Local (`STORAGE_DRIVER=local`)
- Files are saved under local `uploads/...`
- Served from backend path `/uploads/...`

### Production (`STORAGE_DRIVER=gcs`)
- Files are saved to GCS bucket
- Backend still serves URL path `/uploads/...` (no frontend URL change needed)

## 4. Cloud Run Deploy

## 4.1 One-time GCP setup
```powershell
gcloud auth login
gcloud config set project graduatefashion
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com
```

Ensure these exist:
- Cloud SQL instance: `graduatefashion:asia-south1:myecomv2-mumbai`
- GCS bucket: `graduate-ecom-mumbai-641431966702`
- Artifact Registry repo in `asia-south1`: `cloud-run-source-deploy`

### 4.2 Configure deployment values
Edit `cloudbuild.yaml` substitutions for your environment (DB password, JWT, OAuth, etc.).

Important current values in this project:
- `_SERVICE_NAME: "graduatefashion-api"`
- `_REGION: "asia-south1"`
- `_AR_REPO: "cloud-run-source-deploy"`

### 4.3 First deploy / normal deploy
```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE_TAG=manual-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

### 4.4 Redeploy after code changes
Use same command with a new tag each time:
```powershell
gcloud builds submit --config cloudbuild.yaml --substitutions=_IMAGE_TAG=redeploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

### 4.5 Verify deployment
```powershell
gcloud run services describe graduatefashion-api --region asia-south1 --project=graduatefashion --format="value(status.url,status.latestReadyRevisionName)"
```

Health check:
```powershell
curl.exe -i "https://<SERVICE_URL>/api/v1/config/getSystemConfig"
```

## 5. Sync Local `uploads` to GCS Bucket

Use this when migrating media from local machine to bucket.

### Dry run (recommended)
```powershell
gcloud storage rsync .\uploads gs://graduate-ecom-mumbai-641431966702/uploads --recursive --delete-unmatched-destination-objects --dry-run
```

### Actual sync (mirror local to bucket)
```powershell
gcloud storage rsync .\uploads gs://graduate-ecom-mumbai-641431966702/uploads --recursive --delete-unmatched-destination-objects
```

Warning:
- `--delete-unmatched-destination-objects` deletes files in bucket that do not exist locally.

## 6. Common Operations

### Tail Cloud Run logs
```powershell
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="graduatefashion-api"' --project=graduatefashion --limit=100 --format='value(timestamp,textPayload)'
```

### Check Cloud Build details
```powershell
gcloud builds describe <BUILD_ID> --project=graduatefashion --format=json
```

### List Cloud Run services
```powershell
gcloud run services list --region=asia-south1 --project=graduatefashion
```

## 7. Known Gotchas
- If deploy fails with `Bad syntax for dict arg` on `--set-env-vars`, ensure `cloudbuild.yaml` keeps custom delimiter format (`^@@^...@@...`).
- If image URLs work on Cloud Run service URL but fail on custom backend domain, fix domain/proxy routing so `/uploads/*` also goes to the backend service.
- If you see 429 during heavy image load, `/uploads` is already excluded from global limiter in `index.js`.
- **Multi-instance / horizontal scaling**: The admin order polling optimization (V2-052) uses an **in-memory** `orderEventVersion` counter (`helpers/orderEventVersion.js`). Each Cloud Run instance maintains its own counter, so if you scale to 2+ instances behind a load balancer, an admin panel polling instance A will miss mutations that hit instance B. **Fix**: replace the in-memory counter with a Redis `INCR` key (e.g. `INCR order_event_version`) — the rest of the architecture stays identical. This is not an issue while running a single instance (current setup).

## 8. Security Notes
- Do not commit production secrets in git.
- Use Secret Manager for DB password, JWT secret, API keys, and email credentials.
- Rotate any credential that was previously committed.





to migrate face image:

# Go to the API directory
cd /path/to/gcp_graduatefashion_api

# Make sure production .env is in place (STORAGE_DRIVER=gcs, GCS_BUCKET=..., DB_* etc.)

# Run backfill (only missing face images)
node scripts/backfill-face-images.js

# OR force-regenerate ALL (if you want fresh WebP thumbnails)
node scripts/backfill-face-images.js --force
