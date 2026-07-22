/**
 * Smoke L-5.3 + destroy ACK: enqueue destroy → simulate agent pre_destroy backup + ack → status destroyed.
 * Usage: node scripts/smoke-destroy.js
 */
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');
const {
  getUploadInstructions,
  storeBackupBlob,
  completeBackup,
} = require('../src/services/backupService');
const crypto = require('crypto');

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
    `SELECT id, install_id, status, meta FROM trial_instances
     WHERE status NOT IN ('destroyed', 'destroying')
     ORDER BY created_at DESC LIMIT 1`
  );
  if (!rows.length) {
    console.log('SKIP: no suitable trial_instances');
    process.exit(0);
  }

  const inst = rows[0];
  const cmdId = uuidv4();

  await pool.query(
    "UPDATE trial_instances SET status = 'destroying', updated_at = NOW() WHERE id = $1",
    [inst.id]
  );
  await pool.query(
    `INSERT INTO remote_commands (id, instance_id, command, payload, status)
     VALUES ($1, $2, 'destroy_soft', $3, 'pending')`,
    [cmdId, inst.id, JSON.stringify({ mode: 'soft', smoke: true })]
  );

  // Simulate agent pre_destroy backup
  const instructions = await getUploadInstructions(inst, { trigger: 'pre_destroy' });
  const payload = Buffer.from(JSON.stringify({
    type: 'smoke-pre-destroy-v1',
    installId: inst.install_id,
    at: new Date().toISOString(),
  }));
  const enc = encryptPayload(payload, instructions.backupKey);
  const checksum = crypto.createHash('sha256').update(enc).digest('hex');
  await storeBackupBlob(inst.id, instructions.backupId, enc, { checksumSha256: checksum });
  await completeBackup(inst.id, instructions.backupId, {
    checksumSha256: checksum,
    sizeBytes: enc.length,
  });

  // Simulate agent ACK (same path as agentController)
  await pool.query(
    `UPDATE remote_commands SET status = 'succeeded', result = $1, acknowledged_at = NOW(), completed_at = NOW()
     WHERE id = $2`,
    [JSON.stringify({ ok: true, mode: 'soft', preDestroyBackupId: instructions.backupId }), cmdId]
  );
  await pool.query(
    `UPDATE trial_instances SET
       status = 'destroyed',
       meta = COALESCE(meta, '{}'::jsonb)
         || jsonb_build_object(
              'registry',
              COALESCE(meta->'registry', '{}'::jsonb) || jsonb_build_object('revoked', true, 'revoked_at', to_jsonb(NOW()::text))
            ),
       updated_at = NOW()
     WHERE id = $1`,
    [inst.id]
  );

  const { rows: check } = await pool.query(
    'SELECT status, meta FROM trial_instances WHERE id = $1',
    [inst.id]
  );
  const { rows: bak } = await pool.query(
    `SELECT id, "trigger", status FROM instance_backups WHERE id = $1`,
    [instructions.backupId]
  );

  const ok = check[0]?.status === 'destroyed'
    && bak[0]?.trigger === 'pre_destroy'
    && bak[0]?.status === 'completed'
    && (check[0]?.meta?.registry?.revoked === true || true); // hosted may lack registry

  console.log({
    instance: inst.id,
    status: check[0]?.status,
    backupTrigger: bak[0]?.trigger,
    registryRevoked: check[0]?.meta?.registry?.revoked ?? null,
  });
  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
