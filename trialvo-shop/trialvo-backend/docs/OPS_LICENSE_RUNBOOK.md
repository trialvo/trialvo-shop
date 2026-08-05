# Trialvo License & Control Plane — Ops Runbook

## Production secrets (required)

| Variable | Purpose |
|----------|---------|
| `BACKUP_MASTER_KEY` | AES-GCM master for agent/bootstrap/backup secrets at rest. **Required** when `NODE_ENV=production`. |
| `LICENSE_PRIVATE_KEY` / files under `deploy/keys/` | RS256 lease signing. Never commit private PEM. |
| `JWT_SECRET` | Admin API JWT only — do **not** reuse as `BACKUP_MASTER_KEY`. |

Also set: `PUBLIC_API_URL`, `FRONTEND_URL`, registry ACL on the real image registry (installer tokens are bookkeeping only).

## Agent scale defaults

- Steady heartbeat: `AGENT_HEARTBEAT_INTERVAL_SEC=600` (10m)
- Fast poll when commands pending: `AGENT_HEARTBEAT_FAST_SEC=30`
- Heartbeats update `last_heartbeat_at` only — they do **not** write `instance_events`
- Go lease gate ticker: 15m

## Paid vs trial lifecycle

- Trial expire → freeze → soft-destroy after `TRIAL_DESTROY_AFTER_DAYS` (default 7)
- Paid/unlicensed expire → **freeze only**; `PAID_DESTROY_AFTER_DAYS=0` means never auto-destroy

## Customer pack delivery

1. Payment IPN → entitlement + paid seat → email with license key + one-time pack URLs
2. `GET /api/license/pack/:token?format=docker|cpanel` — single use, then token invalidated
3. Admin reissue: `POST /api/admin/trial-instances/:id/reissue-pack` (**super_admin**)

## Installer / bootstrap hygiene

- Public Opt2 installer: 24h TTL (`INSTALLER_DOWNLOAD_TTL_HOURS`) + single download
- Bootstrap token cleared after first successful `register`
- Re-register after that uses agent HMAC headers
- Admin password is **not** in `agent.env` — put `TRIAL_ADMIN_*` in customer `.env` (from email)

## Honest residual risk

If a customer strips the license agent / sets `TRIAL_MODE=0` and `LICENSE_ENFORCE=0`, the Control Plane cannot see or freeze that copy. Document this in ToS; treat control as best-effort for agent-connected installs only.

## Quick verifies

```bash
node scripts/test-pack-download.js
node scripts/verify-dashboard-scopes.js
```
