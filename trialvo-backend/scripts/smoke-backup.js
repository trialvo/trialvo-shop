/**
 * Smoke TS-5.2: in-process backup upload + complete (+ restore command enqueue).
 * Usage: node scripts/smoke-backup.js
 */
require('dotenv').config();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const {
  getUploadInstructions,
  storeBackupBlob,
  completeBackup,
  getBackupForInstance,
} = require('../src/services/backupService');

function encryptPayload(buf, keyHex) {
  const key = Buffer.from(keyHex.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

(async () => {
  const { rows } = await pool.query(
    'SELECT id, install_id FROM trial_instances ORDER BY created_at DESC LIMIT 1'
  );
  if (!rows.length) {
    console.log('SKIP: no trial_instances');
    process.exit(0);
  }

  const inst = rows[0];
  const instructions = await getUploadInstructions(inst, { trigger: 'smoke' });
  console.log('upload instructions', { backupId: instructions.backupId, driver: instructions.driver });

  const payload = Buffer.from(JSON.stringify({
    type: 'smoke-backup-v1',
    at: new Date().toISOString(),
    installId: inst.install_id,
  }));
  const enc = encryptPayload(payload, instructions.backupKey);
  const checksum = crypto.createHash('sha256').update(enc).digest('hex');

  await storeBackupBlob(inst.id, instructions.backupId, enc, { checksumSha256: checksum });
  const row = await completeBackup(inst.id, instructions.backupId, {
    checksumSha256: checksum,
    sizeBytes: enc.length,
  });
  const got = await getBackupForInstance(inst.id, instructions.backupId);

  // Enqueue restore command (TS-5.3 admin path)
  const cmdId = uuidv4();
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, payload, status)
     VALUES ($1, $2, 'restore', $3, 'pending')`,
    [cmdId, inst.id, JSON.stringify({ backupId: instructions.backupId })]
  );
  const { rows: cmds } = await pool.query(
    "SELECT id, command, status FROM remote_commands WHERE id = $1",
    [cmdId]
  );

  console.log('backup', { id: row.id, status: row.status, size: row.size_bytes, checksum });
  console.log('restore cmd', cmds[0]);

  const ok = got?.status === 'completed' && cmds[0]?.command === 'restore';
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
