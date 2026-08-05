/**
 * MySQL helpers via docker exec into trialvo-mysql.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MYSQL } = require('./products');

function run(cmd, args, { input = null, outFile = null } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: [
        input ? 'pipe' : 'ignore',
        outFile ? 'pipe' : 'inherit',
        'inherit',
      ],
    });
    let out = '';
    if (outFile) {
      const ws = fs.createWriteStream(outFile);
      child.stdout.pipe(ws);
      child.stdout.on('data', (d) => { out += d; });
      child.on('close', (code) => {
        ws.end();
        code === 0 ? resolve(out) : reject(new Error(`${cmd} exit ${code}`));
      });
    } else {
      child.on('close', (code) => {
        code === 0 ? resolve(out) : reject(new Error(`${cmd} exit ${code}`));
      });
    }
    child.on('error', reject);
    if (input) {
      if (typeof input === 'string' || Buffer.isBuffer(input)) {
        child.stdin.end(input);
      } else {
        input.pipe(child.stdin);
      }
    }
  });
}

async function assertMysqlUp() {
  await run('docker', [
    'exec', MYSQL.container,
    'mysqladmin', 'ping', '-h', '127.0.0.1',
    `-u${MYSQL.user}`, `-p${MYSQL.password}`,
    '--silent',
  ]);
}

function dumpArgs(database) {
  return [
    'exec', MYSQL.container,
    'mysqldump',
    `-u${MYSQL.user}`, `-p${MYSQL.password}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--events',
    '--hex-blob',
    '--default-character-set=utf8mb4',
    '--set-gtid-purged=OFF',
    // Stable hashes across back-to-back dumps
    '--skip-dump-date',
    '--column-statistics=0',
    database,
  ];
}

async function dumpDatabase(database, outFile) {
  await assertMysqlUp();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  // docker exec mysqldump → stdout → file (wait for disk flush)
  return new Promise((resolve, reject) => {
    const child = spawn('docker', dumpArgs(database), { stdio: ['ignore', 'pipe', 'pipe'] });
    const ws = fs.createWriteStream(outFile);
    let err = '';
    let settled = false;
    let exitCode = null;
    let stdoutEnded = false;

    const finish = () => {
      if (settled || exitCode === null || !stdoutEnded) return;
      settled = true;
      if (exitCode !== 0) {
        reject(new Error(`mysqldump failed (${exitCode}): ${err}`));
        return;
      }
      const size = fs.existsSync(outFile) ? fs.statSync(outFile).size : 0;
      if (size < 64) {
        reject(new Error(`mysqldump produced empty/tiny file (${size} bytes) for ${database}`));
        return;
      }
      resolve();
    };

    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => {
      if (!settled) {
        settled = true;
        reject(e);
      }
    });
    ws.on('error', (e) => {
      if (!settled) {
        settled = true;
        reject(e);
      }
    });
    ws.on('finish', () => {
      stdoutEnded = true;
      finish();
    });
    child.stdout.pipe(ws);
    child.on('close', (code) => {
      exitCode = code;
      // Ensure writer closes if pipe did not already
      if (!ws.writableEnded) ws.end();
      finish();
    });
  });
}

async function restoreDatabase(database, sqlFile) {
  await assertMysqlUp();
  if (!fs.existsSync(sqlFile)) throw new Error(`Missing dump: ${sqlFile}`);
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'exec', '-i', MYSQL.container,
        'mysql', `-u${MYSQL.user}`, `-p${MYSQL.password}`, database,
      ],
      { stdio: ['pipe', 'inherit', 'pipe'] }
    );
    let err = '';
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mysql restore failed (${code}): ${err}`));
    });
    fs.createReadStream(sqlFile).pipe(child.stdin);
  });
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

/** Dump to temp file and return sha256 (for live vs backup compare). */
async function liveDumpSha256(database, tmpFile) {
  await dumpDatabase(database, tmpFile);
  const sha = sha256File(tmpFile);
  return sha;
}

module.exports = {
  MYSQL,
  assertMysqlUp,
  dumpDatabase,
  restoreDatabase,
  sha256File,
  liveDumpSha256,
  run,
};
