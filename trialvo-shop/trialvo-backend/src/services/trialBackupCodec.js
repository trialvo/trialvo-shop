/** KEEP IN SYNC with: products/product-1-lifestyle/Back End/services/trialBackupCodec.js */
/**
 * Trial backup codec (v3 binary + legacy v2 JSON).
 *
 * v3 layout (lossless):
 *   magic "TVB3" (4)
 *   u8 version (=3)
 *   u8 flags (bit0 = hasSql)
 *   u16 reserved (=0)
 *   u32 BE metaLength
 *   meta JSON (utf8) — paths/sizes only, no file bodies
 *   [sql.gz bytes if hasSql]
 *   [upload file bytes in meta.uploads.files order]
 *
 * Wire format on disk/CP (unchanged envelope):
 *   AES-256-GCM( gzip( archiveBytes ), backupKey )
 *
 * Why v3: v2 embedded base64 inside JSON (≈33% bloat) and double-encoded SQL.
 * Restore and production migration both unpack to { sqlText, files[] }.
 */
const zlib = require('zlib');
const crypto = require('crypto');

const MAGIC = Buffer.from('TVB3');
const GZIP_LEVEL = 9;

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function readU32be(buf, offset) {
  return buf.readUInt32BE(offset);
}

function aesGcmEncrypt(plaintext, keyHex) {
  const key = Buffer.from(String(keyHex).slice(0, 64), 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

function aesGcmDecrypt(blob, keyHex) {
  const key = Buffer.from(String(keyHex).slice(0, 64), 'hex');
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const data = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * Build an in-memory v3 archive (before outer gzip+encrypt).
 * SQL and uploads are stored RAW inside the archive; the outer seal applies
 * gzip once across the whole package (avoids double-gzip / base64 bloat).
 */
function packV3Archive(opts) {
  const {
    installId,
    domain,
    sqlText = null,
    sqlError = null,
    uploadFiles = [],
    skipped = [],
    trigger = 'command',
    commandId = null,
    createdAt = new Date().toISOString(),
  } = opts;

  const sqlRaw = sqlText != null ? Buffer.from(sqlText, 'utf8') : null;

  const filesMeta = uploadFiles.map((f) => ({
    path: String(f.path).replace(/\\/g, '/'),
    size: f.buffer.length,
  }));
  const totalBytes = uploadFiles.reduce((n, f) => n + f.buffer.length, 0);

  const meta = {
    type: 'lifestyle-trial-backup-v3',
    version: 3,
    installId,
    domain,
    createdAt,
    commandId,
    trigger,
    sql: sqlRaw
      ? {
          present: true,
          bytes: sqlRaw.length,
          codec: 'raw',
          // length of the following SQL section (raw utf8 bytes)
          sectionBytes: sqlRaw.length,
        }
      : { present: false, error: sqlError || 'sql missing' },
    uploads: {
      count: filesMeta.length,
      totalBytes,
      skipped,
      files: filesMeta,
    },
    note: sqlRaw
      ? 'v3 binary: raw SQL + uploads; single outer gzip+AES (lossless)'
      : 'v3 binary: uploads only (mysqldump unavailable or skipped)',
  };

  const metaBuf = Buffer.from(JSON.stringify(meta), 'utf8');
  const flags = sqlRaw ? 0x01 : 0x00;
  const header = Buffer.concat([
    MAGIC,
    Buffer.from([3, flags, 0, 0]),
    u32be(metaBuf.length),
    metaBuf,
  ]);

  const parts = [header];
  if (sqlRaw) parts.push(sqlRaw);
  for (const f of uploadFiles) parts.push(f.buffer);
  return Buffer.concat(parts);
}

function unpackV3Archive(archive) {
  if (!Buffer.isBuffer(archive) || archive.length < 12) {
    throw new Error('Invalid v3 archive');
  }
  if (!archive.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Not a v3 archive (bad magic)');
  }
  const version = archive[4];
  if (version !== 3) throw new Error(`Unsupported backup archive version ${version}`);
  const flags = archive[5];
  const metaLen = readU32be(archive, 8);
  let offset = 12;
  if (offset + metaLen > archive.length) throw new Error('Truncated v3 meta');
  const meta = JSON.parse(archive.subarray(offset, offset + metaLen).toString('utf8'));
  offset += metaLen;

  let sqlText = null;
  if ((flags & 0x01) && meta.sql?.present) {
    // Prefer sectionBytes; fall back to legacy compressedBytes (early v3 drafts).
    const sectionLen = meta.sql.sectionBytes || meta.sql.compressedBytes;
    if (!sectionLen || offset + sectionLen > archive.length) {
      throw new Error('Truncated v3 SQL section');
    }
    const sqlSection = archive.subarray(offset, offset + sectionLen);
    offset += sectionLen;
    if (meta.sql.codec === 'gzip' || (meta.sql.compressedBytes && !meta.sql.sectionBytes)) {
      sqlText = zlib.gunzipSync(sqlSection).toString('utf8');
    } else {
      sqlText = sqlSection.toString('utf8');
    }
  }

  const files = [];
  for (const entry of meta.uploads?.files || []) {
    const size = entry.size >>> 0;
    if (offset + size > archive.length) throw new Error(`Truncated upload ${entry.path}`);
    files.push({
      path: entry.path,
      size,
      buffer: Buffer.from(archive.subarray(offset, offset + size)),
    });
    offset += size;
  }

  return {
    version: 3,
    type: meta.type,
    meta,
    sqlText,
    files,
  };
}

function unpackV2Json(obj) {
  let sqlText = null;
  if (obj.sql?.gzipBase64) {
    sqlText = zlib.gunzipSync(Buffer.from(obj.sql.gzipBase64, 'base64')).toString('utf8');
  }
  const files = [];
  for (const f of obj.uploads?.files || []) {
    if (!f?.path || !f.contentBase64) continue;
    const buffer = Buffer.from(f.contentBase64, 'base64');
    files.push({ path: f.path, size: buffer.length, buffer });
  }
  return {
    version: obj.version || 2,
    type: obj.type || 'lifestyle-trial-backup-v2',
    meta: obj,
    sqlText,
    files,
  };
}

/**
 * Decrypt CP blob → normalized { version, sqlText, files, meta }.
 * Supports v3 binary and legacy v2/v1 JSON (gzipped or raw).
 */
function openSealedBackup(encryptedBlob, backupKey) {
  const compressed = aesGcmDecrypt(encryptedBlob, backupKey);
  let inner;
  try {
    inner = zlib.gunzipSync(compressed);
  } catch {
    inner = compressed;
  }

  if (inner.length >= 4 && inner.subarray(0, 4).equals(MAGIC)) {
    return unpackV3Archive(inner);
  }

  const text = inner.toString('utf8');
  const obj = JSON.parse(text);
  return unpackV2Json(obj);
}

/** Seal archive for upload: gzip(level 9) + AES-GCM. */
function sealArchive(archiveBuf, backupKey) {
  const compressed = zlib.gzipSync(archiveBuf, { level: GZIP_LEVEL });
  return aesGcmEncrypt(compressed, backupKey);
}

/**
 * Minimal ZIP (store only) — no extra deps. Good for production migration packs
 * where SQL/uploads are already compact or plain text.
 */
function buildZipStore(entries) {
  // entries: [{ name: 'database.sql', data: Buffer }, ...]
  const locals = [];
  const centrals = [];
  let offset = 0;

  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }

  for (const ent of entries) {
    const name = Buffer.from(ent.name.replace(/\\/g, '/'), 'utf8');
    const data = Buffer.isBuffer(ent.data) ? ent.data : Buffer.from(ent.data || '');
    const crc = crc32(data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); // store
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, data);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(centrals.length, 8);
  end.writeUInt16LE(centrals.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, end]);
}

function buildMigrationZip(opened, { domain, installId } = {}) {
  const entries = [];
  const readme = [
    'Trialvo trial → production migration pack',
    '========================================',
    '',
    `Domain: ${domain || opened.meta?.domain || ''}`,
    `Install ID: ${installId || opened.meta?.installId || ''}`,
    `Backup format: ${opened.type || opened.version}`,
    `Created: ${opened.meta?.createdAt || ''}`,
    '',
    'Import steps (MySQL / MariaDB production):',
    '  1. Create an empty database with utf8mb4.',
    '  2. gunzip -c database.sql.gz | mysql -u USER -p DB_NAME',
    '     (Windows: use 7-Zip / Git Bash, or extract then mysql < database.sql)',
    '  3. Copy uploads/ into your production API uploads directory.',
    '  4. Point shop/admin IMAGE_URL / API to production.',
    '',
    'This archive is lossless (exact SQL text + file bytes after gunzip).',
    '',
  ].join('\n');
  entries.push({ name: 'README.txt', data: Buffer.from(readme, 'utf8') });

  if (opened.sqlText) {
    const sqlGz = zlib.gzipSync(Buffer.from(opened.sqlText, 'utf8'), { level: GZIP_LEVEL });
    entries.push({ name: 'database.sql.gz', data: sqlGz });
  } else {
    entries.push({
      name: 'database.sql.MISSING.txt',
      data: Buffer.from('No SQL dump was present in this backup.\n', 'utf8'),
    });
  }

  for (const f of opened.files || []) {
    const safe = String(f.path).replace(/\.\./g, '').replace(/^[/\\]+/, '');
    entries.push({ name: `uploads/${safe}`, data: f.buffer });
  }

  return buildZipStore(entries);
}

module.exports = {
  MAGIC,
  packV3Archive,
  unpackV3Archive,
  unpackV2Json,
  openSealedBackup,
  sealArchive,
  aesGcmEncrypt,
  aesGcmDecrypt,
  buildZipStore,
  buildMigrationZip,
};
