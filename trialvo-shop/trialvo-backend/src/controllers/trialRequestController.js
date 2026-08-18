const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { randomToken, decrypt } = require('../utils/crypto');
const { sendMail } = require('../services/mailer');
const { provisionFromRequest } = require('../services/provisioner');
const { getTrialSettings, defaultDaysForType, clampDays } = require('../services/trialSettings');
const { trialRequestReceivedEmail, FRONTEND, API_PUBLIC } = require('../services/trialEmails');
const { buildInstallerZip, buildTrialInstallerZip, issueRegistryCredentials, parseDeployConfig } = require('../services/packager');
const { supportsTrialOption } = require('../services/packager/productImages');
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

        // Dedup key: email + product + option (hosted | self_hosted).
        // Same user may trial many products, and may take both Option 1 and Option 2
        // for one product — but not the same option twice while pending/active.
        const normalizedEmail = String(email).trim().toLowerCase();

        const prod = await pool.query(
            'SELECT id, is_trialable, name, deploy_config FROM products WHERE slug = $1 AND is_active = 1',
            [productSlug]
        );
        if (prod.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        if (!prod.rows[0].is_trialable) {
            return res.status(400).json({ error: 'This product is not available for trial' });
        }
        const deployConfig = parseDeployConfig(prod.rows[0].deploy_config);
        if (trialType === 'hosted' && !supportsTrialOption(deployConfig, 1)) {
            return res.status(400).json({
                error: 'Option 1 (hosted) trial is not available for this product yet',
                code: 'OPTION1_UNSUPPORTED',
            });
        }
        if (trialType === 'self_hosted' && !supportsTrialOption(deployConfig, 2)) {
            return res.status(400).json({
                error: 'Option 2 (self-hosted) trial is not available for this product',
                code: 'OPTION2_UNSUPPORTED',
            });
        }

        const existing = await pool.query(
            `SELECT id, public_token, status, requested_days, trial_type
             FROM trial_requests
             WHERE LOWER(TRIM(email)) = $1
               AND product_id = $2
               AND trial_type = $3
               AND status IN ('pending', 'active')
             ORDER BY created_at DESC
             LIMIT 1`,
            [normalizedEmail, prod.rows[0].id, trialType]
        );
        if (existing.rows.length > 0) {
            const prev = existing.rows[0];
            const statusUrl = `${FRONTEND}/trial-status/${prev.public_token}`;
            const optionLabel = trialType === 'hosted' ? 'Option 1' : 'Option 2';
            return res.status(200).json({
                ok: true,
                existing: true,
                requestId: prev.id,
                statusToken: prev.public_token,
                statusUrl,
                status: prev.status,
                trialType: prev.trial_type,
                productSlug,
                trialDays: prev.requested_days,
                message: `You already have a ${optionLabel} trial for this product`,
            });
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
                id, publicToken, prod.rows[0].id, trialType, name.trim(), normalizedEmail, phone,
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
            customer_name: name.trim(),
            email: normalizedEmail,
            phone,
            company,
            desired_domain: desiredDomain,
            use_case: useCase,
            requested_days: trialDays,
        };

        const willAutoApprove = trialType === 'hosted' && settings.autoApproveHosted;

        // Respond immediately — provision / email run in background so the UI
        // is not blocked by bcrypt, shared-demo MySQL, or slow SMTP.
        res.status(201).json({
            ok: true,
            requestId: id,
            statusToken: publicToken,
            statusUrl,
            status: willAutoApprove ? 'pending' : 'pending',
            autoApproved: false,
            provisioning: willAutoApprove,
            trialDays,
            message: willAutoApprove
                ? 'Request received. Auto-approval is processing — check email shortly.'
                : 'Request received. You will get an email when approved.',
        });

        setImmediate(() => {
            (async () => {
                try {
                    if (willAutoApprove) {
                        await provisionFromRequest(requestRow, trialDays);
                        console.log(`[trial] auto-approved request ${id}`);
                    } else {
                        const mail = trialRequestReceivedEmail({ name: name.trim(), statusUrl });
                        await sendMail({ to: normalizedEmail, ...mail });
                    }
                } catch (err) {
                    console.error(`[trial] background provision/mail failed for ${id}:`, err.message || err);
                    try {
                        await pool.query(
                            `UPDATE trial_requests SET admin_notes = CONCAT(COALESCE(admin_notes,''), $2), updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
                            [id, `\n[auto] ${err.message || err}`]
                        );
                    } catch { /* ignore */ }
                }
            })();
        });
        return;
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
            extendDays: settings.extendDays,
            extendPriceBdt: settings.extendPriceBdt,
            extendPriceUsd: settings.extendPriceUsd,
            paidExtendDays: settings.paidExtendDays,
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
                    ti.expires_at AS instance_expires, ti.status AS instance_status, ti.meta AS instance_meta
             FROM trial_requests tr
             JOIN products p ON p.id = tr.product_id
             LEFT JOIN trial_instances ti ON ti.request_id = tr.id
             WHERE tr.public_token = $1`,
            [token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const r = rows[0];
        let instanceMeta = r.instance_meta;
        if (typeof instanceMeta === 'string') {
            try { instanceMeta = JSON.parse(instanceMeta); } catch { instanceMeta = {}; }
        }
        const sharedDemo = Boolean(instanceMeta?.sharedDemo);

        const payload = {
            status: r.status,
            trialType: r.trial_type,
            productName: r.product_name,
            productSlug: r.product_slug,
            email: r.email || null,
            customerName: r.customer_name || null,
            requestedAt: r.created_at,
            approvedAt: r.approved_at,
            trialDays: r.requested_days,
            expiresAt: r.instance_expires,
            shopUrl: r.shop_url,
            adminUrl: r.admin_url,
            apiUrl: r.api_url,
            instanceStatus: r.instance_status,
            instanceId: r.instance_id || null,
            sharedDemo,
            disclaimer: sharedDemo
                ? (instanceMeta?.disclaimer || 'Shared demo — product data may be visible to other trial users')
                : null,
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
 * TTL 24h from first availability; single public download (admin ZIP still available).
 */
async function downloadPublicInstaller(req, res, next) {
    try {
        const { token } = req.params;
        const { rows } = await pool.query(
            `SELECT ti.*, tr.public_token, tr.desired_domain, tr.trial_type AS request_trial_type,
                    p.slug AS product_slug, p.deploy_config
             FROM trial_requests tr
             JOIN trial_instances ti ON ti.request_id = tr.id
             LEFT JOIN products p ON p.id = ti.product_id
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

        const meta = (typeof inst.meta === 'object' && inst.meta) ? { ...inst.meta } : {};
        if (meta.registry?.revoked) {
            return res.status(410).json({ error: 'Registry token revoked' });
        }
        if (meta.installer_consumed_at) {
            return res.status(410).json({
                error: 'Installer already downloaded — contact support for a reissue',
                code: 'INSTALLER_CONSUMED',
            });
        }

        const issuedAt = meta.installer_issued_at
            ? new Date(meta.installer_issued_at).getTime()
            : new Date(inst.created_at).getTime();
        const ttlMs = parseInt(process.env.INSTALLER_DOWNLOAD_TTL_HOURS || '24', 10) * 3600 * 1000;
        if (Number.isFinite(issuedAt) && Date.now() - issuedAt > ttlMs) {
            return res.status(410).json({
                error: 'Installer download link expired',
                code: 'INSTALLER_EXPIRED',
            });
        }

        let registry = meta.registry;
        if (!registry?.token) {
            registry = issueRegistryCredentials({ installId: inst.install_id, expiresAt: inst.expires_at });
            meta.registry = registry;
        }

        const zip = buildTrialInstallerZip({
            installId: inst.install_id,
            agentSecret: decrypt(inst.agent_secret_enc),
            bootstrapToken: inst.bootstrap_token_enc ? decrypt(inst.bootstrap_token_enc) : '',
            domain: inst.domain || inst.desired_domain,
            backupKey: inst.backup_key_enc ? decrypt(inst.backup_key_enc) : '',
            registryCreds: registry,
            adminEmail: inst.admin_email || '',
            adminPassword: '',
            productSlug: inst.product_slug || 'lifestyle-ecommerce',
            deployConfig: inst.deploy_config,
        });

        meta.installer_consumed_at = new Date().toISOString();
        if (!meta.installer_issued_at) meta.installer_issued_at = new Date(inst.created_at).toISOString();

        await pool.query(
            `UPDATE trial_instances SET meta = $1, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(meta), inst.id]
        );

        await logEvent(inst.id, 'installer_downloaded', { public: true, singleUse: true });
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zip.filename}"`);
        res.setHeader('Cache-Control', 'no-store');
        res.send(zip.buffer);
    } catch (err) {
        next(err);
    }
}

module.exports = { createTrialRequest, getTrialStatus, getPublicTrialConfig, downloadPublicInstaller };
