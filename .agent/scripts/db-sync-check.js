/**
 * Compare live MySQL dump hash with latest timestamped backup.
 * If different and --apply: restore latest backup into the DB.
 * If different and --backup: take a new timestamped backup (local ahead).
 *
 * Usage:
 *   node .agent/scripts/db-sync-check.js lifestyle
 *   node .agent/scripts/db-sync-check.js all
 *   node .agent/scripts/db-sync-check.js fashion --apply
 *   node .agent/scripts/db-sync-check.js fashion --backup
 *   node .agent/scripts/db-sync-check.js techshop --db techshop_demo --apply
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { listProducts } = require('./lib/products');
const {
  assertMysqlUp,
  liveDumpSha256,
  sha256File,
} = require('./lib/mysql');

function parseArgs(argv) {
  const args = {
    product: 'all',
    db: null,
    apply: false,
    backup: false,
  };
  const rest = argv.slice(2);
  if (rest[0] && !rest[0].startsWith('--')) args.product = rest.shift();
  for (const a of rest) {
    if (a === '--apply') args.apply = true;
    else if (a === '--backup') args.backup = true;
    else if (a === '--db') args._expectDb = true;
    else if (args._expectDb) {
      args.db = a;
      args._expectDb = false;
    }
  }
  if (args.apply && args.backup) {
    throw new Error('Use only one of --apply or --backup');
  }
  return args;
}

function readLatest(product, database) {
  const pointer = path.join(product.backupDir, `latest-${database}.json`);
  if (fs.existsSync(pointer)) {
    const meta = JSON.parse(fs.readFileSync(pointer, 'utf8'));
    const full = path.join(product.backupDir, meta.file);
    if (fs.existsSync(full)) {
      const sha = meta.sha256 || sha256File(full);
      return { file: full, sha, name: meta.file };
    }
  }
  if (!fs.existsSync(product.backupDir)) return null;
  const re = new RegExp(`^${database}_\\d{8}_\\d{6}\\.sql$`);
  const files = fs
    .readdirSync(product.backupDir)
    .filter((f) => re.test(f))
    .map((f) => ({
      name: f,
      path: path.join(product.backupDir, f),
      mtime: fs.statSync(path.join(product.backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files[0]) return null;
  return {
    file: files[0].path,
    name: files[0].name,
    sha: sha256File(files[0].path),
  };
}

function runNodeScript(script, scriptArgs) {
  const r = spawnSync(
    process.execPath,
    [path.join(__dirname, script), ...scriptArgs],
    { stdio: 'inherit' }
  );
  if (r.status !== 0) throw new Error(`${script} failed with exit ${r.status}`);
}

async function checkOne(product, database, { apply, backup }) {
  const latest = readLatest(product, database);
  const tmp = path.join(
    os.tmpdir(),
    `trialvo-${product.key}-${database}-${Date.now()}.sql`
  );

  try {
    console.log(`==> [${product.key}] compare live ${database}`);
    const liveSha = await liveDumpSha256(database, tmp);

    if (!latest) {
      console.log('  no timestamped backup yet');
      if (backup || (!apply && !backup)) {
        console.log('  → taking initial backup');
        runNodeScript('db-backup.js', [product.key, '--db', database]);
        return { status: 'backed_up_initial' };
      }
      console.log('  (pass --backup to create one)');
      return { status: 'missing_backup' };
    }

    const match = liveSha === latest.sha;
    console.log(`  live   ${liveSha.slice(0, 12)}…`);
    console.log(`  backup ${latest.sha.slice(0, 12)}… (${latest.name})`);

    if (match) {
      console.log('  ✅ in sync');
      return { status: 'synced' };
    }

    console.log('  ⚠ DIFF — live DB ≠ latest backup');
    if (apply) {
      console.log('  → --apply: restore latest backup into MySQL');
      runNodeScript('db-restore.js', [product.key, '--db', database]);
      return { status: 'restored' };
    }
    if (backup) {
      console.log('  → --backup: snapshot current live DB');
      runNodeScript('db-backup.js', [product.key, '--db', database]);
      return { status: 'backed_up' };
    }
    console.log('  hint: --apply (pull backup → DB)  OR  --backup (DB → new dump)');
    return { status: 'diff' };
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

async function main() {
  const args = parseArgs(process.argv);
  await assertMysqlUp();
  const products = listProducts(args.product);
  const summary = [];

  for (const product of products) {
    const dbs = args.db
      ? args.db === 'all'
        ? product.databases
        : [args.db]
      : [product.defaultDb];
    for (const database of dbs) {
      const r = await checkOne(product, database, args);
      summary.push({ product: product.key, database, ...r });
    }
  }

  console.log('\n=== summary ===');
  for (const row of summary) {
    console.log(`  ${row.product}/${row.database}: ${row.status}`);
  }

  const unresolved = summary.filter((s) => s.status === 'diff' || s.status === 'missing_backup');
  if (unresolved.length && !args.apply && !args.backup) {
    process.exit(2);
  }
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
