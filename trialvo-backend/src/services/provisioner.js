const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { encrypt, randomHex, randomToken } = require('../utils/crypto');
const { sendMail } = require('./mailer');
const { logEvent } = require('./trialEvents');
const { trialReadyEmail, FRONTEND, API_PUBLIC } = require('./trialEmails');
const { issueRegistryCredentials } = require('./packager');
const {
  sharedDemoEnabled,
  getSharedDemoUrls,
  ensureConfigured,
  createTrialAdmin,
} = require('./sharedDemoProvisioner');

const TRIAL_DOMAIN_BASE = process.env.TRIAL_DOMAIN_BASE || 'trial.trialvo.com';

function randomPassword() {
  return `Trial@${randomHex(4)}`;
}

/**
 * Option 1 (hosted): grant ADMIN access on the shared Lifestyle demo.
 * Does not create a per-request Docker stack.
 */
async function provisionHostedSharedDemo(requestRow, {
  instanceId, installId, adminEmail, adminPassword, agentSecret, bootstrapToken, backupKey, expiresAt, days,
}) {
  const check = await ensureConfigured();
  if (!check.ok) {
    await pool.query(
      `UPDATE trial_instances
         SET status = 'failed', meta = $2, updated_at = NOW()
       WHERE id = $1`,
      [instanceId, JSON.stringify({ note: 'Shared demo not configured', error: check.error, sharedDemo: true })]
    );
    await logEvent(instanceId, 'shared_demo_provision_failed', { error: check.error });
    throw new Error(`Shared demo provision failed: ${check.error}`);
  }

  const urls = check.urls || getSharedDemoUrls();
  const created = await createTrialAdmin({
    email: adminEmail,
    password: adminPassword,
    name: requestRow.customer_name,
  });
  if (!created.ok) {
    await pool.query(
      `UPDATE trial_instances
         SET status = 'failed', meta = $2, updated_at = NOW()
       WHERE id = $1`,
      [instanceId, JSON.stringify({ note: 'Shared demo admin create failed', error: created.error, sharedDemo: true })]
    );
    await logEvent(instanceId, 'shared_demo_admin_failed', { error: created.error });
    throw new Error(`Shared demo admin create failed: ${created.error}`);
  }

  const meta = {
    note: 'Option 1 shared demo — ADMIN access grant (no per-trial Docker)',
    sharedDemo: true,
    provisionMode: 'shared',
    lifestyleAdminEmail: adminEmail,
    lifestyleAdminId: created.adminId,
    roleId: created.roleId,
    disclaimer: 'Shared demo — product data may be visible to other trial users',
  };

  await pool.query(
    `UPDATE trial_instances
       SET status = 'active', shop_url = $2, admin_url = $3, api_url = $4, meta = $5, updated_at = NOW()
     WHERE id = $1`,
    [instanceId, urls.shopUrl, urls.adminUrl, urls.apiUrl, JSON.stringify(meta)]
  );
  await logEvent(instanceId, 'shared_demo_provisioned', {
    adminId: created.adminId,
    shopUrl: urls.shopUrl,
  });

  return {
    shopUrl: urls.shopUrl,
    adminUrl: urls.adminUrl,
    apiUrl: urls.apiUrl,
    meta,
  };
}

async function provisionFromRequest(requestRow, days = 14) {
  const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [requestRow.product_id]);
  if (productRes.rows.length === 0) throw new Error('Product not found');

  const product = productRes.rows[0];
  const instanceId = uuidv4();
  const installId = uuidv4().replace(/-/g, '');
  const agentSecret = randomHex(32);
  const bootstrapToken = randomToken(32);
  const backupKey = randomHex(32);
  const adminEmail = (requestRow.email || '').trim().toLowerCase()
    || `trial-${installId.slice(0, 8)}@trialvo.demo`;
  const adminPassword = randomPassword();
  const expiresAt = new Date(Date.now() + days * 86400000);

  const isHosted = requestRow.trial_type === 'hosted';
  let subdomain = null;
  let domain = null;
  let status;

  if (isHosted) {
    subdomain = `${product.slug}-shared`;
    domain = `shared-demo.${TRIAL_DOMAIN_BASE}`;
    status = 'active';
  } else {
    domain = requestRow.desired_domain || null;
    status = 'provisioning';
  }

  await pool.query(
    `INSERT INTO trial_instances (
      id, install_id, request_id, product_id, trial_type, status,
      domain, subdomain, shop_url, admin_url, api_url,
      admin_email, admin_password_enc, agent_secret_enc, bootstrap_token_enc, backup_key_enc,
      started_at, expires_at, meta
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,NULL,$9,$10,$11,$12,$13,NOW(),$14,$15)`,
    [
      instanceId, installId, requestRow.id, requestRow.product_id, requestRow.trial_type, status,
      domain, subdomain,
      adminEmail, encrypt(adminPassword), encrypt(agentSecret), encrypt(bootstrapToken), encrypt(backupKey),
      expiresAt,
      JSON.stringify({ note: 'provisioning' }),
    ]
  );

  let shopUrl = null;
  let adminUrl = null;
  let apiUrl = null;

  if (isHosted) {
    if (!sharedDemoEnabled()) {
      await pool.query(
        `UPDATE trial_instances SET status = 'failed', meta = $2, updated_at = NOW() WHERE id = $1`,
        [instanceId, JSON.stringify({
          note: 'SHARED_DEMO_ENABLED must be 1 for Option 1 hosted trials',
          error: 'shared_demo_disabled',
        })]
      );
      throw new Error('Option 1 requires SHARED_DEMO_ENABLED=1 (per-trial Docker stacks are disabled)');
    }

    const result = await provisionHostedSharedDemo(requestRow, {
      instanceId, installId, adminEmail, adminPassword,
      agentSecret, bootstrapToken, backupKey, expiresAt, days,
    });
    shopUrl = result.shopUrl;
    adminUrl = result.adminUrl;
    apiUrl = result.apiUrl;
  } else {
    // Option 2 — installer + agent (unchanged)
    const registry = issueRegistryCredentials({ installId, expiresAt });
    const meta = {
      note: 'Awaiting agent register',
      registry,
      installer: { ready: true },
    };
    await pool.query(
      'UPDATE trial_instances SET meta = $2, updated_at = NOW() WHERE id = $1',
      [instanceId, JSON.stringify(meta)]
    );
  }

  await pool.query(
    "UPDATE trial_requests SET status = 'active', approved_at = NOW(), updated_at = NOW() WHERE id = $1",
    [requestRow.id]
  );

  await logEvent(instanceId, 'provisioned', { trial_type: requestRow.trial_type, days, sharedDemo: isHosted });

  const statusUrl = `${FRONTEND}/trial-status/${requestRow.public_token}`;
  const installerUrl = requestRow.trial_type === 'self_hosted'
    ? `${API_PUBLIC}/api/trial/installer/${requestRow.public_token}`
    : null;

  const mail = trialReadyEmail({
    name: requestRow.customer_name,
    days,
    statusUrl,
  });
  await sendMail({ to: requestRow.email, ...mail });

  return {
    instanceId, installId, adminEmail, adminPassword, bootstrapToken,
    shopUrl, adminUrl, expiresAt, installerUrl,
  };
}

module.exports = { provisionFromRequest };
