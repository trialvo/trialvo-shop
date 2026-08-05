/**
 * Timestamped MySQL backup per product. Keeps only the latest N dumps per DB.
 *
 * Usage:
 *   node .agent/scripts/db-backup.js lifestyle
 *   node .agent/scripts/db-backup.js fashion --db fashion_demo
 *   node .agent/scripts/db-backup.js all
 *   node .agent/scripts/db-backup.js techshop --db all
 */
const fs = require('fs');
const path = require('path');
const { listProducts, KEEP_BACKUPS } = require('./lib/products');
const { dumpDatabase, sha256File, assertMysqlUp } = require('./lib/mysql');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function parseArgs(argv) {
  const args = { product: 'all', dbs: null };
  const rest = argv.slice(2);
  if (rest[0] && !rest[0].startsWith('--')) {
    args.product = rest.shift();
  }
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--db' && rest[i + 1]) {
      args.dbs = rest[++i];
    }
  }
  return args;
}

function listBackupFiles(dir, database) {
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`^${database}_\\d{8}_\\d{6}\\.sql$`);
  return fs
    .readdirSync(dir)
    .filter((f) => re.test(f))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
}

function prune(dir, database, keep) {
  const files = listBackupFiles(dir, database);
  const drop = files.slice(keep);
  for (const f of drop) {
    fs.unlinkSync(f.path);
    const meta = `${f.path}.sha256`;
    if (fs.existsSync(meta)) fs.unlinkSync(meta);
    console.log(`  pruned ${f.name}`);
  }
  // Remove orphan *.sql.sha256 with no matching dump
  const reSha = new RegExp(`^${database}_\\d{8}_\\d{6}\\.sql\\.sha256$`);
  for (const name of fs.readdirSync(dir)) {
    if (!reSha.test(name)) continue;
    const sqlName = name.replace(/\.sha256$/, '');
    if (!fs.existsSync(path.join(dir, sqlName))) {
      fs.unlinkSync(path.join(dir, name));
      console.log(`  pruned orphan ${name}`);
    }
  }
}

function writeLatestPointer(dir, database, fileName, sha) {
  const latestPath = path.join(dir, `latest-${database}.json`);
  fs.writeFileSync(
    latestPath,
    JSON.stringify(
      {
        database,
        file: fileName,
        sha256: sha,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
}

async function backupProduct(product, dbFilter) {
  fs.mkdirSync(product.backupDir, { recursive: true });
  const dbs =
    !dbFilter || dbFilter === 'all'
      ? product.databases
      : dbFilter === 'default'
        ? [product.defaultDb]
        : [dbFilter];

  for (const database of dbs) {
    if (!product.databases.includes(database) && dbFilter !== 'all') {
      // allow explicit override
    }
    const fileName = `${database}_${stamp()}.sql`;
    const outFile = path.join(product.backupDir, fileName);
    console.log(`==> [${product.key}] dumping ${database} → ${fileName}`);
    await dumpDatabase(database, outFile);
    const sha = sha256File(outFile);
    fs.writeFileSync(`${outFile}.sha256`, `${sha}  ${fileName}\n`, 'utf8');
    writeLatestPointer(product.backupDir, database, fileName, sha);
    console.log(`  sha256 ${sha.slice(0, 12)}…  keep=${KEEP_BACKUPS}`);
    prune(product.backupDir, database, KEEP_BACKUPS);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  await assertMysqlUp();
  const products = listProducts(args.product);
  const dbFilter = args.dbs || 'default';
  for (const p of products) {
    await backupProduct(p, dbFilter);
  }
  console.log('✅ backup done');
}

main().catch((e) => {
  console.error('❌', e.message || e);
  process.exit(1);
});
