# db-backup

Timestamped MySQL dumps for this product live here.

- Pattern: `<database>_YYYYMMDD_HHMMSS.sql`
- Keep last 3 per database (auto-pruned by `.agent/scripts/db-backup.js`)
- Pointer: `latest-<database>.json`

From monorepo root:

```powershell
node .agent/scripts/db-backup.js fashion
node .agent/scripts/db-restore.js fashion
node .agent/scripts/db-sync-check.js fashion
```

See `d:\our product\.agent\DB_BACKUP.md`.
