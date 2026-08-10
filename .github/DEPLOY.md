# Deploy branch CI/CD

Push to the **`deploy`** branch (or run the workflow manually) to deploy only what changed.

## Architecture

| VPS | IP | Role | Deploy job |
|-----|-----|------|------------|
| **OLD** | `155.248.253.24` | Trialvo Shop CP (`shop.trialvo.com`, `shop-api.trialvo.com`) + `payvault-app` | `deploy-shop-old`, `deploy-pay-old` |
| **NEW** | `217.216.108.119` | Shared MySQL + 3 product demos (`5100–5102`, etc.) | `deploy-demos-new` |

Pay (`pay.trialvo.com`) is **not** redeployed unless `trialvo-pay/**` changes **and** `DEPLOY_PAY_ENABLED=true`.

## Path → target mapping

| Changed paths | Deploy |
|---------------|--------|
| `trialvo-shop/trialvo-frontend/**` | OLD VPS — frontend only |
| `trialvo-shop/trialvo-backend/**` | OLD VPS — backend only |
| `trialvo-shop/**` (compose, nginx, etc.) | OLD VPS — frontend + backend |
| `products/product-1-lifestyle/**` | NEW VPS — lifestyle demo images + containers |
| `products/product-2-fashion/**` | NEW VPS — fashion demo |
| `products/product-3-tech-shop/**` | NEW VPS — tech demo |
| `infra/**`, `trialvo-shop/deploy/shared-demo/**` | NEW VPS — infra + demo stack |
| `trialvo-pay/**` | OLD VPS — Pay (only if enabled) |
| `scripts/ci/**`, `.github/workflows/deploy.yml` | Both (shop + demos flags) |

## GitHub repository secrets

Configure in **Settings → Secrets and variables → Actions**:

### OLD VPS (Shop + Pay)

| Secret | Example | Notes |
|--------|---------|--------|
| `OLD_VPS_HOST` | `155.248.253.24` | |
| `OLD_VPS_USER` | `opc` | |
| `OLD_VPS_SSH_KEY` | *(private key contents)* | Same key as local `ssh-key-2026-03-19.key` |

### NEW VPS (demos)

| Secret | Example | Notes |
|--------|---------|--------|
| `NEW_VPS_HOST` | `217.216.108.119` | |
| `NEW_VPS_USER` | `root` | |
| `NEW_VPS_SSH_KEY` | *(optional)* | Prefer key over password |
| `NEW_VPS_PASSWORD` | *(if no key)* | Root password |

### Optional

| Secret | Value | Notes |
|--------|-------|--------|
| `DEPLOY_PAY_ENABLED` | `true` | Required to auto-deploy Pay on `trialvo-pay/**` changes |

### One-time setup with GitHub CLI

```bash
gh secret set OLD_VPS_HOST -b"155.248.253.24"
gh secret set OLD_VPS_USER -b"opc"
gh secret set OLD_VPS_SSH_KEY < "D:/qik earn/ssh-key-2026-03-19.key"
gh secret set NEW_VPS_HOST -b"217.216.108.119"
gh secret set NEW_VPS_USER -b"root"
gh secret set NEW_VPS_PASSWORD -b"<root-password>"
# Optional — only when you want Pay auto-deploy:
gh secret set DEPLOY_PAY_ENABLED -b"true"
```

The workflow **`validate`** job fails fast if any required secret is missing.

## Server prerequisites

**OLD VPS**

```bash
/home/opc/trialvo-shop/   # docker compose prod + shared-demo-remote
/home/opc/payvault/       # optional Pay compose
```

**NEW VPS**

```bash
/opt/trialvo/             # products/, infra/, trialvo-shop/deploy/
```

Docker must be installed on both servers.

## Usage

### Normal deploy (push to `deploy`)

```bash
git checkout deploy
git merge main   # or your feature branch
git push origin deploy
```

GitHub Actions runs `.github/workflows/deploy.yml` and deploys only changed components.

### Manual full deploy

GitHub → **Actions** → **Deploy (deploy branch)** → **Run workflow** → check:

- Force deploy Shop CP
- Force deploy demos
- Force deploy Pay (needs `DEPLOY_PAY_ENABLED=true`)

## Safety

- Shop deploy **always** checks `http://127.0.0.1:8088/health` before and after (Pay must stay healthy).
- Shop deploy uses `--no-deps` so MySQL/Postgres/Pay containers are not recreated.
- Concurrency group `trialvo-production-deploy` prevents overlapping deploys.
- Bundles are extracted on the server **before** remote scripts run (fresh-server safe).
- Post-deploy **`verify`** job re-checks health on each VPS.

## Local scripts

```bash
# Detect what would deploy (needs bash / WSL / Git Bash)
scripts/ci/detect-deploy-targets.sh origin/deploy HEAD

# Package bundles (same as CI)
scripts/ci/package-shop-bundle.sh
scripts/ci/package-demos-bundle.sh

# Full local simulation (Python + SSH to OLD VPS)
python .agent/scripts/test-ci-deploy.py
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `validate` job fails | Add missing GitHub secrets (see above) |
| `set: pipefail: invalid option` | Shell scripts must be LF — `.gitattributes` enforces this |
| Shop job skipped | No `trialvo-shop/**` changes — use manual **Force deploy Shop** |
| Demos job skipped | No product/infra changes — use **Force deploy demos** |
| Pay not deployed | Set `DEPLOY_PAY_ENABLED=true` or deploy Pay manually |
| Frontend build permission error on OLD VPS | Workflow runs `sudo rm -rf trialvo-frontend` when needed |
| NEW VPS SSH fails | Add `NEW_VPS_SSH_KEY` or `NEW_VPS_PASSWORD` secret |
| False smoke `5100 fail` | Fixed — smoke uses `lib.sh` without `curl \| head` pipefail |
