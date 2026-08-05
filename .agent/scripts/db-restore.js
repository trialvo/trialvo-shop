/**
 * Restore latest (or explicit) SQL dump into product MySQL database.
 *
 * Usage:
 *   node .agent/scripts/db-restore.js lifestyle
 *   node .agent/scripts/db-restore.js fashion --db fashion_demo
 *   node .agent/scripts/db-restore.js techshop --file "Back End/db-backup/techshop_demo_....sql"
 *   node .agent/scripts/db-restore.js all
 */
const fs = require('fs');
const path = require('path');
const { listProducts, resolveProduct } = require('./lib/products');
const { restoreDatabase, assertMysqlUp, sha256File } = require('./lib/mysql');

function parseArgs(argv) {
  const args = { product: null, db: null, file: null };
  const rest = argv.slice(2);
  if (!rest[0] || rest[0].startsWith('--')) {
    throw new Error('Product required: lifestyle | fashion | techshop | all');
  }
  args.product = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--db' && rest[i + 1]) args.db = rest[++i];
    else if (rest[i] === '--file' && rest[i + 1]) args.file = rest[++i];
  }
  return args;
}

function latestForDb(product, database) {
  const pointer = path.join(product.backupDir, `latest-${database}.json`);
  if (fs.existsSync(pointer)) {
    const meta = JSON.parse(fs.readFileSync(pointer, 'utf8'));
    const full = path.join(product.backupDir, meta.file);
    if (fs.existsSync(full)) return { file: full, meta };
  }
  // Fallback: newest matching dump
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
  return { file: files[0].path, meta: { file: files[0].name, database } };
}

async function restoreOne(product, database, filePath) {
  let target = filePath;
  if (!target) {
    const latest = latestForDb(product, database);
    if (!latest) {
      // legacy seed fallback
      const legacy = path.join(product.legacyBackupDir, 'myecomv2.sql');
      if (fs.existsSync(legacy)) {
        console.log(`==> [${product.key}] no timestamped backup; using legacy myecomv2.sql`);
        target = legacy;
      } else {
        throw new Error(`No backup found for ${product.key}/${database}`);
      }
    } else {
      target = latest.file;
      console.log(`==> [${product.key}] latest → ${path.basename(target)}`);
    }
  } else if (!path.isAbsolute(target)) {
    target = path.resolve(product.folder, target);
  }

  console.log(`==> [${product.key}] restore ${database} ← ${target}`);
  await restoreDatabase(database, target);
  const sha = sha256File(target);
  console.log(`  applied sha256 ${sha.slice(0, 12)}…`);
}

async function main() {
  const args = parseArgs(process.argv);
  await assertMysqlUp();
  const products = listProducts(args.product);

  for (const product of products) {
    if (args.file && products.length > 1) {
      throw new Error('--file cannot be used with "all"');
    }
    if (args.file) {
      const database = args.db || product.defaultDb;
      await restoreOne(product, database, args.file);
      continue;
    }
    const dbs = args.db
      ? args.db === 'all'
        ? product.databases
        : [args.db]
      : [product.defaultDb];
    for (const database of dbs) {
      await restoreOne(product, database, null);
    }
  }
  console.log('✅ restore done');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
