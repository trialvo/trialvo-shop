const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { encrypt, decrypt, randomHex } = require('../utils/crypto');
const { saveBuffer, deleteKey, DRIVER, PUBLIC_BASE, openReadStreamAsync } = require('./storage');
const { logEvent } = require('./trialEvents');

/** How many completed backups to keep per instance (VPS disk). Default 2. */
function backupKeepCount() {
  const n = parseInt(process.env.BACKUP_KEEP_COUNT || '2', 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 20) : 2;
}

async function ensureBackupKey(instanceId) {
  const { rows } = await pool.query(
    'SELECT backup_key_enc FROM trial_instances WHERE id = $1',
    [instanceId]
  );
  if (!rows.length) throw new Error('Instance not found');

  if (rows[0].backup_key_enc) {
    return decrypt(rows[0].backup_key_enc);
  }

  const key = randomHex(32);
  await pool.query(
    'UPDATE trial_instances SET backup_key_enc = $1, updated_at = NOW() WHERE id = $2',
    [encrypt(key), instanceId]
  );
  return key;
}

async function createPendingBackup(instanceId, trigger = 'manual') {
  const id = uuidv4();
  // Placeholder key until blob lands (required NOT NULL)
  const storageKey = `backups/${instanceId}/${id}.enc`;
  await pool.query(
    `INSERT INTO instance_backups (id, instance_id, storage_key, \`trigger\`, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [id, instanceId, storageKey, trigger]
  );
  return { id, storageKey };
}

async function getUploadInstructions(instance, { trigger = 'manual' } = {}) {
  const backupKey = await ensureBackupKey(instance.id);
  const pending = await createPendingBackup(instance.id, trigger);

  const { getPublicApiUrl } = require('../config/publicUrls');
  const apiBase = getPublicApiUrl();

  if (DRIVER === 'local') {
    return {
      backupId: pending.id,
      storageKey: pending.storageKey,
      method: 'POST',
      uploadUrl: `${apiBase}/api/agent/backup/blob`,
      backupKey,
      driver: 'local',
      fields: { backupId: pending.id },
    };
  }

  throw new Error(`Backup upload not supported for driver "${DRIVER}" yet`);
}

async function storeBackupBlob(instanceId, backupId, buffer, { checksumSha256 } = {}) {
  const { rows } = await pool.query(
    'SELECT * FROM instance_backups WHERE id = $1 AND instance_id = $2',
    [backupId, instanceId]
  );
  if (!rows.length) {
    const err = new Error('Backup record not found');
    err.status = 404;
    throw err;
  }
  if (rows[0].status === 'completed') {
    return { ok: true, alreadyComplete: true, backup: rows[0] };
  }

  const stored = await saveBuffer(buffer, {
    ext: '.enc',
    subdir: `backups/${instanceId}`,
  });

  await pool.query(
    `UPDATE instance_backups SET
       storage_key = $1,
       size_bytes = $2,
       checksum_sha256 = $3,
       status = 'uploading'
     WHERE id = $4`,
    [stored.storageKey, buffer.length, checksumSha256 || null, backupId]
  );

  return { ok: true, storageKey: stored.storageKey, sizeBytes: buffer.length };
}

/**
 * Keep only the newest N completed backups. Deletes older blobs from storage
 * and removes DB rows so VPS disk does not accumulate every manual/pre_destroy copy.
 */
async function pruneOldBackups(instanceId, { keep } = {}) {
  const keepN = keep != null ? keep : backupKeepCount();
  const { rows } = await pool.query(
    `SELECT id, storage_key FROM instance_backups
     WHERE instance_id = $1 AND status = 'completed'
     ORDER BY COALESCE(completed_at, created_at) DESC, created_at DESC`,
    [instanceId]
  );
  if (rows.length <= keepN) return { kept: rows.length, deleted: 0 };

  const toDelete = rows.slice(keepN);
  let deleted = 0;
  for (const row of toDelete) {
    try {
      await deleteKey(row.storage_key);
    } catch (e) {
      console.warn('[backupService] prune deleteKey failed', row.storage_key, e.message);
    }
    await pool.query('DELETE FROM instance_backups WHERE id = $1 AND instance_id = $2', [
      row.id,
      instanceId,
    ]);
    deleted += 1;
  }

  // Drop abandoned pending/uploading rows older than 24h.
  try {
    const { rows: stale } = await pool.query(
      `SELECT id, storage_key FROM instance_backups
       WHERE instance_id = $1 AND status IN ('pending','uploading')
         AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)`,
      [instanceId]
    );
    for (const row of stale) {
      try { await deleteKey(row.storage_key); } catch { /* ignore */ }
      await pool.query('DELETE FROM instance_backups WHERE id = $1', [row.id]);
      deleted += 1;
    }
  } catch (e) {
    console.warn('[backupService] stale prune failed', e.message);
  }

  if (deleted) {
    await logEvent(instanceId, 'backup_pruned', { keep: keepN, deleted });
  }
  return { kept: keepN, deleted };
}

async function completeBackup(instanceId, backupId, { checksumSha256, sizeBytes } = {}) {
  const { rows } = await pool.query(
    'SELECT * FROM instance_backups WHERE id = $1 AND instance_id = $2',
    [backupId, instanceId]
  );
  if (!rows.length) {
    const err = new Error('Backup record not found');
    err.status = 404;
    throw err;
  }

  await pool.query(
    `UPDATE instance_backups SET
       status = 'completed',
       completed_at = NOW(),
       checksum_sha256 = COALESCE($1, checksum_sha256),
       size_bytes = COALESCE($2, size_bytes)
     WHERE id = $3`,
    [checksumSha256 || null, sizeBytes != null ? sizeBytes : null, backupId]
  );

  await logEvent(instanceId, 'backup', { backupId, sizeBytes });

  try {
    await pruneOldBackups(instanceId);
  } catch (e) {
    console.warn('[backupService] prune after complete failed', e.message);
  }

  const { rows: updated } = await pool.query('SELECT * FROM instance_backups WHERE id = $1', [backupId]);
  return updated[0];
}

async function getBackupForInstance(instanceId, backupId) {
  const { rows } = await pool.query(
    "SELECT * FROM instance_backups WHERE id = $1 AND instance_id = $2 AND status = 'completed'",
    [backupId, instanceId]
  );
  return rows[0] || null;
}

async function listBackups(instanceId) {
  const { rows } = await pool.query(
    `SELECT id, storage_key, size_bytes, checksum_sha256, \`trigger\`, status, created_at, completed_at
     FROM instance_backups WHERE instance_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [instanceId]
  );
  return rows;
}

/** Read sealed .enc from storage → decrypt → normalize (v2/v3). */
async function openStoredBackup(instanceId, backupId) {
  const row = await getBackupForInstance(instanceId, backupId);
  if (!row) return null;
  const key = await ensureBackupKey(instanceId);
  const { openSealedBackup } = require('./trialBackupCodec');

  const chunks = [];
  const stream = await openReadStreamAsync(row.storage_key);
  await new Promise((resolve, reject) => {
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', resolve);
    stream.on('error', reject);
  });
  const blob = Buffer.concat(chunks);
  const opened = openSealedBackup(blob, key);
  return { row, opened, backupKey: key };
}

module.exports = {
  ensureBackupKey,
  createPendingBackup,
  getUploadInstructions,
  storeBackupBlob,
  completeBackup,
  getBackupForInstance,
  listBackups,
  pruneOldBackups,
  backupKeepCount,
  openStoredBackup,
};
