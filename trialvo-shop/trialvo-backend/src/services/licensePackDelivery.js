/**
 * Customer paid pack download — one-time token (hash stored on entitlement).
 */
const { pool } = require('../config/db');
const { decrypt, encrypt, randomToken } = require('../utils/crypto');
const { hashKey, parseMeta } = require('./licenseEntitlements');
const { logEvent } = require('./trialEvents');
const {
  buildPaidDockerZip,
  buildPaidCpanelZip,
  issueRegistryCredentials,
  loadLicensePublicKey,
} = require('./packager');
const { getPublicApiUrl } = require('../config/publicUrls');

function packDownloadUrl(packToken, format = 'docker') {
  const base = getPublicApiUrl();
  const fmt = format === 'cpanel' ? 'cpanel' : 'docker';
  return `${base}/api/license/pack/${encodeURIComponent(packToken)}?format=${fmt}`;
}

async function findEntitlementByPackToken(packToken) {
  const h = hashKey(packToken);
  const { rows } = await pool.query(
    `SELECT * FROM license_entitlements
     WHERE pack_download_token_hash = $1 AND status = 'active'
     LIMIT 1`,
    [h]
  );
  return rows[0] || null;
}

async function findPaidInstanceForEntitlement(entitlementId) {
  const { rows } = await pool.query(
    `SELECT ti.*, p.slug AS product_slug, p.deploy_config
     FROM trial_instances ti
     LEFT JOIN products p ON p.id = ti.product_id
     WHERE ti.entitlement_id = $1
       AND ti.instance_kind IN ('paid', 'unlicensed')
     ORDER BY ti.created_at DESC
     LIMIT 1`,
    [entitlementId]
  );
  return rows[0] || null;
}

async function buildZipForInstance(inst, format) {
  if (!inst.agent_secret_enc || !inst.bootstrap_token_enc) {
    const err = new Error('Instance secrets missing');
    err.status = 400;
    throw err;
  }
  let productSlug = inst.product_slug;
  let deployConfig = inst.deploy_config;
  if (!productSlug && inst.product_id) {
    const { rows: prows } = await pool.query(
      'SELECT slug, deploy_config FROM products WHERE id = $1',
      [inst.product_id]
    );
    productSlug = prows[0]?.slug;
    deployConfig = prows[0]?.deploy_config;
  }
  const ctx = {
    installId: inst.install_id,
    agentSecret: decrypt(inst.agent_secret_enc),
    bootstrapToken: decrypt(inst.bootstrap_token_enc),
    domain: inst.domain || '',
    backupKey: inst.backup_key_enc ? decrypt(inst.backup_key_enc) : '',
    adminEmail: inst.admin_email || '',
    expiresAt: inst.expires_at,
    licensePublicKey: loadLicensePublicKey(),
    productSlug: productSlug || 'lifestyle-ecommerce',
    deployConfig,
  };

  if (format === 'cpanel') {
    return buildPaidCpanelZip(ctx);
  }

  let meta = parseMeta(inst.meta);
  let registry = meta.registry;
  if (!registry?.token) {
    registry = issueRegistryCredentials({
      installId: inst.install_id,
      expiresAt: inst.expires_at,
    });
    await pool.query(
      `UPDATE trial_instances SET meta = JSON_MERGE_PATCH(COALESCE(meta, '{}'), ?) WHERE id = ?`,
      [JSON.stringify({ registry, hostMode: 'docker' }), inst.id]
    );
  }
  return buildPaidDockerZip({ ...ctx, registryCreds: registry });
}

/**
 * Consume one-time pack token: verify → ZIP → invalidate hash.
 */
async function downloadAndConsumePackToken(packToken, format = 'docker') {
  const ent = await findEntitlementByPackToken(packToken);
  if (!ent) {
    const err = new Error('Invalid or already used pack download link');
    err.status = 401;
    err.code = 'PACK_TOKEN_INVALID';
    throw err;
  }

  const inst = await findPaidInstanceForEntitlement(ent.id);
  if (!inst) {
    const err = new Error('No deployment seat for this license yet');
    err.status = 404;
    throw err;
  }

  const zip = await buildZipForInstance(inst, format === 'cpanel' ? 'cpanel' : 'docker');

  // Invalidate token (rotate to unknown value — admin must reissue)
  const dead = randomToken(32);
  const meta = parseMeta(ent.meta);
  meta.pack_downloaded_at = new Date().toISOString();
  meta.pack_download_format = format;
  delete meta.pending_pack_token_enc;

  await pool.query(
    `UPDATE license_entitlements SET
       pack_download_token_hash = $1,
       meta = $2,
       updated_at = NOW()
     WHERE id = $3`,
    [hashKey(dead), JSON.stringify(meta), ent.id]
  );

  await logEvent(inst.id, 'customer_pack_downloaded', {
    format,
    entitlementId: ent.id,
    public: true,
  });

  return { zip, entitlement: ent, instance: inst };
}

/**
 * Admin/support: mint a fresh pack token (returns plaintext once).
 */
async function reissuePackToken(entitlementId) {
  const { rows } = await pool.query('SELECT * FROM license_entitlements WHERE id = $1', [entitlementId]);
  if (!rows.length) {
    const err = new Error('Entitlement not found');
    err.status = 404;
    throw err;
  }
  const packToken = randomToken(32);
  const meta = parseMeta(rows[0].meta);
  meta.pending_pack_token_enc = encrypt(packToken);
  meta.pack_reissued_at = new Date().toISOString();
  delete meta.pack_downloaded_at;

  await pool.query(
    `UPDATE license_entitlements SET
       pack_download_token_hash = $1,
       meta = $2,
       updated_at = NOW()
     WHERE id = $3`,
    [hashKey(packToken), JSON.stringify(meta), entitlementId]
  );

  return { packToken, entitlement: rows[0] };
}

module.exports = {
  packDownloadUrl,
  findEntitlementByPackToken,
  downloadAndConsumePackToken,
  reissuePackToken,
  buildZipForInstance,
};
