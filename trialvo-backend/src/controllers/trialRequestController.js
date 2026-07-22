const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { randomToken, decrypt } = require('../utils/crypto');
const { sendMail } = require('../services/mailer');
const { provisionFromRequest } = require('../services/provisioner');
const { getTrialSettings, defaultDaysForType, clampDays } = require('../services/trialSettings');
const { trialRequestReceivedEmail, FRONTEND, API_PUBLIC } = require('../services/trialEmails');
const { buildInstallerZip, issueRegistryCredentials } = require('../services/packager');
const { logEvent } = require('../services/trialEvents');

async function createTrialRequest(req, res, next) {
    try {
        const settings = await getTrialSettings();
        if (!settings.trialsEnabled) {
            return res.status(403).json({ error: 'Trial requests are temporarily disabled', code: 'TRIALS_DISABLED' });
        }

        const {
            productSlug, trialType, name, email, phone,
            company, desiredDomain, useCase, requestedDays,
        } = req.body;

        if (!productSlug || !trialType || !name || !email || !phone) {
            return res.status(400).json({ error: 'productSlug, trialType, name, email, phone are required' });
        }
        if (!['hosted', 'self_hosted'].includes(trialType)) {
            return res.status(400).json({ error: 'trialType must be hosted or self_hosted' });
        }
        if (trialType === 'self_hosted' && !desiredDomain) {
            return res.status(400).json({ error: 'desiredDomain required for self_hosted' });
        }

        const prod = await pool.query(
            'SELECT id, is_trialable, name FROM products WHERE slug = $1 AND is_active = 1',
            [productSlug]
        );
        if (prod.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        if (!prod.rows[0].is_trialable) {
            return res.status(400).json({ error: 'This product is not available for trial' });
        }

        const defaultDays = defaultDaysForType(settings, trialType);
        const trialDays = requestedDays ? clampDays(requestedDays, defaultDays) : defaultDays;

        const id = uuidv4();
        const publicToken = randomToken(24);
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

        await pool.query(
            `INSERT INTO trial_requests (
              id, public_token, product_id, trial_type, customer_name, email, phone,
              company, desired_domain, use_case, requested_days, ip_address
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
            [
                id, publicToken, prod.rows[0].id, trialType, name, email, phone,
                company || null, desiredDomain || null, useCase || null,
                trialDays, ip,
            ]
        );

        const statusUrl = `${FRONTEND}/trial-status/${publicToken}`;
        const requestRow = {
            id,
            public_token: publicToken,
            product_id: prod.rows[0].id,
            trial_type: trialType,
            customer_name: name,
            email,
            phone,
            company,
            desired_domain: desiredDomain,
            use_case: useCase,
            requested_days: trialDays,
        };

        let autoApproved = false;
        let provisionResult = null;

        // Option 1: auto-provision when admin enabled auto-approve for hosted trials
        if (trialType === 'hosted' && settings.autoApproveHosted) {
            provisionResult = await provisionFromRequest(requestRow, trialDays);
            autoApproved = true;
        } else {
            const mail = trialRequestReceivedEmail({ name, statusUrl, autoApproved: false });
            await sendMail({ to: email, ...mail });
        }

        res.status(201).json({
            ok: true,
            requestId: id,
            statusToken: publicToken,
            statusUrl,
            status: autoApproved ? 'active' : 'pending',
            autoApproved,
            trialDays,
            ...(provisionResult ? { shopUrl: provisionResult.shopUrl, adminUrl: provisionResult.adminUrl } : {}),
        });
    } catch (err) {
        next(err);
    }
}

async function getPublicTrialConfig(req, res, next) {
    try {
        const settings = await getTrialSettings();
        res.json({
            hostedDays: settings.hostedDays,
            selfHostedDays: settings.selfHostedDays,
            autoApproveHosted: settings.autoApproveHosted,
            trialsEnabled: settings.trialsEnabled,
        });
    } catch (err) {
        next(err);
    }
}

async function getTrialStatus(req, res, next) {
    try {
        const { token } = req.params;
        const { rows } = await pool.query(
            `SELECT tr.*, p.name AS product_name, p.slug AS product_slug,
                    ti.id AS instance_id, ti.install_id, ti.shop_url, ti.admin_url, ti.api_url,
                    ti.admin_email, ti.admin_password_enc, ti.bootstrap_token_enc,
                    ti.expires_at AS instance_expires, ti.status AS instance_status
             FROM trial_requests tr
             JOIN products p ON p.id = tr.product_id
             LEFT JOIN trial_instances ti ON ti.request_id = tr.id
             WHERE tr.public_token = $1`,
            [token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const r = rows[0];
        const isActive = r.status === 'active' && r.instance_id;

        const payload = {
            status: r.status,
            trialType: r.trial_type,
            productName: r.product_name,
            productSlug: r.product_slug,
            requestedAt: r.created_at,
            approvedAt: r.approved_at,
            trialDays: r.requested_days,
            expiresAt: r.instance_expires,
            shopUrl: r.shop_url,
            adminUrl: r.admin_url,
            apiUrl: r.api_url,
            instanceStatus: r.instance_status,
            instanceId: r.instance_id || null,
        };

        // Expose credentials when instance exists (token-gated page)
        if (r.instance_id && r.admin_email) {
            payload.credentials = {
                adminEmail: r.admin_email,
                adminPassword: r.admin_password_enc ? decrypt(r.admin_password_enc) : null,
            };
            if (r.trial_type === 'self_hosted') {
                payload.credentials.installId = r.install_id;
                payload.credentials.bootstrapToken = r.bootstrap_token_enc
                    ? decrypt(r.bootstrap_token_enc)
                    : null;
                payload.installerUrl = `${API_PUBLIC}/api/trial/installer/${token}`;
            }
        }

        res.json(payload);
    } catch (err) {
        next(err);
    }
}

/**
 * Public Opt2 installer download gated by request public_token.
 */
async function downloadPublicInstaller(req, res, next) {
    try {
        const { token } = req.params;
        const { rows } = await pool.query(
            `SELECT ti.*, tr.public_token, tr.desired_domain, tr.trial_type AS request_trial_type
             FROM trial_requests tr
             JOIN trial_instances ti ON ti.request_id = tr.id
             WHERE tr.public_token = $1`,
            [token]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const inst = rows[0];
        if (inst.trial_type !== 'self_hosted') {
            return res.status(400).json({ error: 'Installer only for self_hosted trials' });
        }
        if (['destroyed', 'destroying'].includes(inst.status)) {
            return res.status(410).json({ error: 'Trial destroyed — installer unavailable' });
        }

        const meta = (typeof inst.meta === 'object' && inst.meta) ? inst.meta : {};
        if (meta.registry?.revoked) {
            return res.status(410).json({ error: 'Registry token revoked' });
        }

        let registry = meta.registry;
        if (!registry?.token) {
            registry = issueRegistryCredentials({ installId: inst.install_id, expiresAt: inst.expires_at });
            await pool.query(
                `UPDATE trial_instances SET meta = COALESCE(meta, '{}'::jsonb) || $1::jsonb WHERE id = $2`,
                [JSON.stringify({ registry }), inst.id]
            );
        }

        const zip = buildInstallerZip({
            installId: inst.install_id,
            agentSecret: decrypt(inst.agent_secret_enc),
            bootstrapToken: decrypt(inst.bootstrap_token_enc),
            domain: inst.domain || inst.desired_domain,
            backupKey: inst.backup_key_enc ? decrypt(inst.backup_key_enc) : '',
            registryCreds: registry,
            adminEmail: inst.admin_email || '',
            adminPassword: inst.admin_password_enc ? decrypt(inst.admin_password_enc) : '',
        });

        await logEvent(inst.id, 'installer_downloaded', { public: true });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
        res.send(zip.buffer);
    } catch (err) {
        next(err);
    }
}

module.exports = { createTrialRequest, getTrialStatus, getPublicTrialConfig, downloadPublicInstaller };
