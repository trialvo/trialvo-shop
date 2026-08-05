/**
 * Offline codec smoke: v3 round-trip integrity + size vs legacy v2-style packing.
 * Run: node scripts/test-backup-codec.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const {
  packV3Archive,
  sealArchive,
  openSealedBackup,
  buildMigrationZip,
  aesGcmEncrypt,
} = require('../src/services/trialBackupCodec');

const key = crypto.randomBytes(32).toString('hex');

// Prefer real demo dump if present; else synthetic
const demoCandidates = [
  path.join(__dirname, '..', '..', '..', 'products', 'product-1-lifestyle', 'Back End', 'db backup', 'myecomv2.sql'),
  path.join(__dirname, '..', '..', '..', 'products', 'product-1-lifestyle', 'Back End', 'db-backup', 'myecomv2.sql'),
];
let sqlText = null;
for (const p of demoCandidates) {
  if (fs.existsSync(p)) {
    sqlText = fs.readFileSync(p, 'utf8');
    console.log('Using demo SQL:', p, `(${(Buffer.byteLength(sqlText) / 1024 / 1024).toFixed(2)} MB raw)`);
    break;
  }
}
if (!sqlText) {
  sqlText = `-- synthetic\nCREATE TABLE t(id INT);\nINSERT INTO t VALUES (1);\n` + 'x'.repeat(200_000);
  console.log('Using synthetic SQL');
}

const uploadFiles = [
  { path: 'products/a.webp', buffer: crypto.randomBytes(12_000) },
  { path: 'products/b.webp', buffer: crypto.randomBytes(8_000) },
];

// Legacy v2-style sealed size (what we used to store)
function sealV2Legacy() {
  const manifest = {
    type: 'lifestyle-trial-backup-v2',
    version: 2,
    sql: {
      present: true,
      bytes: Buffer.byteLength(sqlText, 'utf8'),
      gzipBase64: zlib.gzipSync(Buffer.from(sqlText, 'utf8')).toString('base64'),
    },
    uploads: {
      count: uploadFiles.length,
      files: uploadFiles.map((f) => ({
        path: f.path,
        size: f.buffer.length,
        contentBase64: f.buffer.toString('base64'),
      })),
    },
  };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(manifest), 'utf8'));
  return aesGcmEncrypt(compressed, key);
}

const v2 = sealV2Legacy();
const archive = packV3Archive({
  installId: 'test-install',
  domain: 'demo.local',
  sqlText,
  uploadFiles,
  trigger: 'command',
});
const v3 = sealArchive(archive, key);

console.log('v2 sealed bytes:', v2.length, `(${(v2.length / 1024 / 1024).toFixed(2)} MB)`);
console.log('v3 sealed bytes:', v3.length, `(${(v3.length / 1024 / 1024).toFixed(2)} MB)`);
console.log('savings:', `${(((v2.length - v3.length) / v2.length) * 100).toFixed(1)}%`);

const opened = openSealedBackup(v3, key);
if (opened.sqlText !== sqlText) {
  console.error('FAIL: SQL mismatch after round-trip');
  process.exit(1);
}
if (opened.files.length !== uploadFiles.length) {
  console.error('FAIL: upload count mismatch');
  process.exit(1);
}
for (let i = 0; i < uploadFiles.length; i++) {
  if (!opened.files[i].buffer.equals(uploadFiles[i].buffer)) {
    console.error('FAIL: upload bytes mismatch', uploadFiles[i].path);
    process.exit(1);
  }
}

const zip = buildMigrationZip(opened, { domain: 'demo.local', installId: 'test-install' });
console.log('migration zip bytes:', zip.length, `(${(zip.length / 1024 / 1024).toFixed(2)} MB)`);
if (zip.length < 100 || zip[0] !== 0x50 || zip[1] !== 0x4b) {
  console.error('FAIL: zip magic');
  process.exit(1);
}

// Legacy open path
const openedV2 = openSealedBackup(v2, key);
if (openedV2.sqlText !== sqlText) {
  console.error('FAIL: v2 legacy open SQL mismatch');
  process.exit(1);
}

console.log('\n✅ CODEC OK — lossless v3 + legacy v2 open + migration ZIP');
