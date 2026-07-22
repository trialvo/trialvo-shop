const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { encrypt, randomHex, randomToken } = require('../utils/crypto');
const { sendMail } = require('./mailer');
const { logEvent } = require('./trialEvents');
const { trialReadyEmail, FRONTEND, API_PUBLIC } = require('./trialEmails');
const { issueRegistryCredentials } = require('./packager');
const { dockerEnabled, provisionDockerStack } = require('./dockerProvisioner');

const DEMO_SHOP = process.env.TRIAL_DEMO_SHOP_URL || 'http://localhost:5000';
const DEMO_ADMIN = process.env.TRIAL_DEMO_ADMIN_URL || 'http://localhost:5173';
const DEMO_API = process.env.TRIAL_DEMO_API_URL || 'http://localhost:9000';
const TRIAL_DOMAIN_BASE = process.env.TRIAL_DOMAIN_BASE || 'trial.trialvo.com';

function randomPassword() {
    return `Trial@${randomHex(4)}`;
}

function loadLicensePublicKey() {
    if (process.env.LICENSE_PUBLIC_KEY) return process.env.LICENSE_PUBLIC_KEY;
    const candidates = [
        path.resolve(__dirname, '../../../deploy/keys/license_public.pem'),
        path.resolve(__dirname, '../../deploy/keys/license_public.pem'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    }
    return '';
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
    // Use the customer's request email as Lifestyle admin login so the inbox
    // they already check is also the admin username. Fallback only if missing.
    const adminEmail = (requestRow.email || '').trim()
      || `trial-${installId.slice(0, 8)}@trialvo.demo`;
    const adminPassword = randomPassword();
    const expiresAt = new Date(Date.now() + days * 86400000);

    const isHosted = requestRow.trial_type === 'hosted';
    let subdomain = null;
    let domain = null;
    // A hosted instance is marked 'active' up-front so the license agent that
    // boots INSIDE the freshly-provisioned container can both register and
    // obtain a lease immediately — the lease endpoint only issues when the
    // instance status is 'active'. Self-hosted stays 'provisioning' until the
    // customer's agent registers from their own host.
    let status;
    if (isHosted) {
        subdomain = `${product.slug}-${installId.slice(0, 6)}`;
        domain = `${subdomain}.${TRIAL_DOMAIN_BASE}`;
        status = 'active';
    } else {
        domain = requestRow.desired_domain || null;
        status = 'provisioning';
    }

    // Step 1 — persist the instance record FIRST (source of truth). This must
    // happen before we boot any runtime so the agent's first register/lease call
    // finds its row. URLs + docker meta are reconciled after provisioning.
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

    // Step 2 — provision the runtime, then reconcile URLs/meta/status.
    let shopUrl = null;
    let adminUrl = null;
    let apiUrl = null;
    let meta = {};

    if (isHosted) {
        let dockerResult = null;
        if (dockerEnabled()) {
            dockerResult = await provisionDockerStack({
                installId,
                agentSecret,
                bootstrapToken,
                subdomain,
                licensePublicKey: loadLicensePublicKey(),
                adminEmail,
                adminPassword,
            });
        }

        if (dockerResult?.ok) {
            shopUrl = dockerResult.urls.shopUrl;
            adminUrl = dockerResult.urls.adminUrl;
            apiUrl = dockerResult.urls.apiUrl;
            meta = {
                note: `Option 1 Docker provisioned (${dockerResult.mode || 'traefik'} mode)`,
                docker: {
                    project: dockerResult.project,
                    projectDir: dockerResult.projectDir,
                    mode: dockerResult.mode || 'traefik',
                    ports: dockerResult.ports || null,
                    apiReady: dockerResult.apiReady ?? null,
                },
            };
            await logEvent(instanceId, 'docker_provisioned', {
                project: dockerResult.project,
                mode: dockerResult.mode,
                ports: dockerResult.ports,
            });
        } else if (dockerEnabled()) {
            // Docker provisioning was requested but failed — mark the instance
            // failed rather than leaving it "active" with no reachable runtime.
            status = 'failed';
            meta = {
                note: 'Docker provision failed',
                error: dockerResult?.error || dockerResult?.skipped || 'unknown',
            };
            await logEvent(instanceId, 'docker_provision_failed', { error: dockerResult?.error });
        } else {
            // MVP path (Docker disabled): shared demo stack URLs.
            shopUrl = DEMO_SHOP;
            adminUrl = DEMO_ADMIN;
            apiUrl = DEMO_API;
            meta = { note: 'MVP: shared demo stack URLs' };
        }

        await pool.query(
            `UPDATE trial_instances
               SET status = $2, shop_url = $3, admin_url = $4, api_url = $5, meta = $6, updated_at = NOW()
             WHERE id = $1`,
            [instanceId, status, shopUrl, adminUrl, apiUrl, JSON.stringify(meta)]
        );
    } else {
        const registry = issueRegistryCredentials({ installId, expiresAt });
        meta = {
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

    await logEvent(instanceId, 'provisioned', { trial_type: requestRow.trial_type, days });

    const statusUrl = `${FRONTEND}/trial-status/${requestRow.public_token}`;
    const installerUrl = requestRow.trial_type === 'self_hosted'
        ? `${API_PUBLIC}/api/trial/installer/${requestRow.public_token}`
        : null;

    const mail = trialReadyEmail({
        name: requestRow.customer_name,
        days,
        shopUrl,
        adminUrl,
        adminEmail,
        adminPassword,
        statusUrl,
        trialType: requestRow.trial_type,
        installId,
        bootstrapToken,
        installerUrl,
    });
    await sendMail({ to: requestRow.email, ...mail });

    return {
        instanceId, installId, adminEmail, adminPassword, bootstrapToken,
        shopUrl, adminUrl, expiresAt, installerUrl,
    };
}

module.exports = { provisionFromRequest };
