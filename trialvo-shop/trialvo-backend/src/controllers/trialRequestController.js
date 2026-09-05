const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { randomToken, decrypt } = require('../utils/crypto');
const { sendMail } = require('../services/mailer');
const { provisionFromRequest } = require('../services/provisioner');
const {
    getTrialSettings, toPublicConfig, clampMonths, monthsToDays,
} = require('../services/trialSettings');
const {
    trialRequestReceivedEmail, domainTrialReceivedEmail, FRONTEND, API_PUBLIC,
} = require('../services/trialEmails');
const { buildTrialInstallerZip, issueRegistryCredentials, parseDeployConfig } = require('../services/packager');
const { supportsTrialOption } = require('../services/packager/productImages');
const { logEvent } = require('../services/trialEvents');
const {
    STAGES, initialStageFor, validateHostingGate, parseHistory,
} = require('../services/trialFulfillment');
const {
    isDisposableEmail, isValidEmail, honeypotTripped, checkRateLimits,
} = require('../services/trialAbuseGuard');
const { notifyStaffNewDomainTrial } = require('../services/staffAlerts');

/** Public aliases → stored trial_type. Keeps old clients working while the UI speaks "demo"/"domain". */
const TRIAL_TYPE_ALIASES = {
    demo: 'hosted',
    hosted: 'hosted',
    domain: 'self_hosted',
    self_hosted: 'self_hosted',
};

/** How long the request waits for shared-demo provisioning before falling back to "poll status". */
const INSTANT_PROVISION_TIMEOUT_MS = parseInt(process.env.TRIAL_INSTANT_PROVISION_TIMEOUT_MS || '20000', 10);

function clientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || null;
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(Object.assign(new Error('provision_timeout'), { code: 'PROVISION_TIMEOUT' })), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Credentials + URLs for an already-provisioned demo request (dedupe path). */
async function loadDemoAccess(requestId) {
    const { rows } = await pool.query(
        `SELECT id, shop_url, admin_url, admin_email, admin_password_enc, expires_at, status
           FROM trial_instances WHERE request_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [requestId]
    );
    const inst = rows[0];
    if (!inst || !inst.admin_email) return null;
    return {
        instanceId: inst.id,
        instanceStatus: inst.status,
        shopUrl: inst.shop_url,
        adminUrl: inst.admin_url,
        expiresAt: inst.expires_at,
        credentials: {
            adminEmail: inst.admin_email,
            adminPassword: inst.admin_password_enc ? decrypt(inst.admin_password_enc) : null,
        },
    };
}

/**
 * POST /api/trial/requests
 *
 * Two very different paths share one endpoint so old clients keep working:
 *   hosted      → instant demo. Provision synchronously, return credentials.
 *   self_hosted → own-domain trial. Validate hosting gate, queue for staff.
 */
async function createTrialRequest(req, res, next) {
    try {
        const settings = await getTrialSettings();
        if (!settings.trialsEnabled) {
            return res.status(403).json({ error: 'Trial requests are temporarily disabled', code: 'TRIALS_DISABLED' });
        }

        // Bots fill hidden fields; humans never see them. Reply with a boring 400
        // so the bot learns nothing about which check it failed.
        if (honeypotTripped(req.body)) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const {
            productSlug, name, email, phone, company, useCase,
            desiredDomain, requestedMonths, hostingSource, hostKind, hasHosting,
            sourceRequestId,
        } = req.body || {};
        const trialType = TRIAL_TYPE_ALIASES[String(req.body?.trialType || '').trim()];

        if (!productSlug || !trialType || !name || !email || !phone) {
            return res.status(400).json({ error: 'productSlug, trialType, name, email, phone are required' });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Enter a valid email address', code: 'EMAIL_INVALID' });
        }
        if (isDisposableEmail(normalizedEmail)) {
            return res.status(400).json({
                error: 'Temporary email addresses are not accepted — we send your login there.',
                code: 'EMAIL_DISPOSABLE',
            });
        }

        const isDemo = trialType === 'hosted';
        if (isDemo && !settings.demoEnabled) {
            return res.status(403).json({ error: 'Instant demo is paused right now. Please try again later.', code: 'DEMO_DISABLED' });
        }
        if (!isDemo && !settings.domainEnabled) {
            return res.status(403).json({ error: 'Own-domain trials are paused right now.', code: 'DOMAIN_TRIAL_DISABLED' });
        }

        const prod = await pool.query(
            'SELECT id, slug, is_trialable, name, deploy_config FROM products WHERE slug = $1 AND is_active = 1',
            [productSlug]
        );
        if (prod.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        const product = prod.rows[0];
        if (!product.is_trialable) {
            return res.status(400).json({ error: 'This product is not available for trial' });
        }
        const deployConfig = parseDeployConfig(product.deploy_config);
        if (isDemo && !supportsTrialOption(deployConfig, 1)) {
            return res.status(400).json({ error: 'Instant demo is not available for this product yet', code: 'DEMO_UNSUPPORTED' });
        }
        if (!isDemo && !supportsTrialOption(deployConfig, 2)) {
            return res.status(400).json({ error: 'Own-domain trial is not available for this product', code: 'DOMAIN_TRIAL_UNSUPPORTED' });
        }

        // Dedupe: one live request per email + product + path. For demos we hand
        // back the existing credentials instead of minting another admin — this
        // doubles as "I lost my password, resend it".
        const existing = await pool.query(
            `SELECT id, public_token, status, requested_days, requested_months, trial_type, fulfillment_stage
               FROM trial_requests
              WHERE email = $1 AND product_id = $2 AND trial_type = $3
                AND status IN ('pending', 'active')
              ORDER BY created_at DESC LIMIT 1`,
            [normalizedEmail, product.id, trialType]
        );
        if (existing.rows.length > 0) {
            const prev = existing.rows[0];
            const statusUrl = `${FRONTEND}/trial-status/${prev.public_token}`;
            const base = {
                ok: true,
                existing: true,
                requestId: prev.id,
                statusToken: prev.public_token,
                statusUrl,
                status: prev.status,
                trialType: prev.trial_type,
                path: isDemo ? 'demo' : 'domain',
                productSlug,
                trialDays: prev.requested_days,
                requestedMonths: prev.requested_months,
                fulfillmentStage: prev.fulfillment_stage,
            };
            if (isDemo) {
                const access = await loadDemoAccess(prev.id);
                return res.status(200).json({
                    ...base,
                    ...(access || { provisioning: prev.status === 'pending' }),
                    message: access ? 'Welcome back — here is your existing demo access.' : 'Your demo is still being prepared.',
                });
            }
            return res.status(200).json({ ...base, message: 'You already have an own-domain trial request for this product.' });
        }

        const ip = clientIp(req);
        const limit = await checkRateLimits({ ip, email: normalizedEmail, settings });
        if (!limit.ok) {
            res.setHeader('Retry-After', String(limit.retryAfterSeconds));
            return res.status(429).json({ error: limit.error, code: limit.code });
        }

        const id = uuidv4();
        const publicToken = randomToken(24);
        const statusUrl = `${FRONTEND}/trial-status/${publicToken}`;
        const cleanName = String(name).trim().slice(0, 150);
        const cleanPhone = String(phone).trim().slice(0, 40);
        const productName = typeof product.name === 'object' ? (product.name?.en || product.name?.bn) : product.name;

        // ── Path A: instant demo ─────────────────────────────────────────────
        if (isDemo) {
            const trialDays = settings.hostedDays;
            await pool.query(
                `INSERT INTO trial_requests (
                   id, public_token, product_id, trial_type, customer_name, email, phone,
                   company, use_case, requested_days, ip_address
                 ) VALUES ($1,$2,$3,'hosted',$4,$5,$6,$7,$8,$9,$10)`,
                [id, publicToken, product.id, cleanName, normalizedEmail, cleanPhone, company || null, useCase || null, trialDays, ip]
            );

            const requestRow = {
                id, public_token: publicToken, product_id: product.id, trial_type: 'hosted',
                customer_name: cleanName, email: normalizedEmail, phone: cleanPhone,
                company, requested_days: trialDays,
            };

            // Provision inline: the whole point of the instant demo is that the
            // response carries the login. If the demo DB is slow we fall back to
            // "provisioning" and let the status page poll.
            const provisionJob = provisionFromRequest(requestRow, trialDays);
            try {
                const result = await withTimeout(provisionJob, INSTANT_PROVISION_TIMEOUT_MS);
                return res.status(201).json({
                    ok: true,
                    path: 'demo',
                    requestId: id,
                    statusToken: publicToken,
                    statusUrl,
                    status: 'active',
                    instanceId: result.instanceId,
                    shopUrl: result.shopUrl,
                    adminUrl: result.adminUrl,
                    expiresAt: result.expiresAt,
                    trialDays,
                    credentials: { adminEmail: result.adminEmail, adminPassword: result.adminPassword },
                    message: 'Your demo is ready.',
                });
            } catch (err) {
                if (err.code === 'PROVISION_TIMEOUT') {
                    // Keep the background job alive; it will finish and the status page will show creds.
                    provisionJob.catch((e) => console.error(`[trial] late provision failed for ${id}:`, e.message || e));
                    return res.status(202).json({
                        ok: true,
                        path: 'demo',
                        requestId: id,
                        statusToken: publicToken,
                        statusUrl,
                        status: 'pending',
                        provisioning: true,
                        trialDays,
                        message: 'Your demo is taking a moment — the access page will update automatically.',
                    });
                }
                console.error(`[trial] instant demo provision failed for ${id}:`, err.message || err);
                await pool.query(
                    `UPDATE trial_requests SET admin_notes = CONCAT(COALESCE(admin_notes,''), $2), updated_at = NOW() WHERE id = $1`,
                    [id, `\n[auto] ${err.message || err}`]
                );
                return res.status(503).json({
                    ok: false,
                    code: 'DEMO_PROVISION_FAILED',
                    statusToken: publicToken,
                    statusUrl,
                    error: 'We could not start your demo automatically. Our team has been notified — check the access page shortly.',
                });
            }
        }

        // ── Path B: own-domain trial ─────────────────────────────────────────
        const gate = validateHostingGate(
            { hostingSource, hostKind, hasHosting, desiredDomain },
            { hostingPurchaseEnabled: settings.hostingPurchaseEnabled }
        );
        if (!gate.ok) {
            return res.status(400).json({ error: gate.error, code: gate.code });
        }

        // Months must be one the admin actually offers. Omitted → default; an
        // explicit value we do not offer is rejected rather than silently changed,
        // so the customer never ends up with a different duration than they chose.
        const monthsProvided = requestedMonths !== undefined && requestedMonths !== null && requestedMonths !== '';
        const months = monthsProvided ? Number(requestedMonths) : settings.defaultMonths;
        if (!Number.isInteger(months) || !settings.domainMonths.includes(months)) {
            return res.status(400).json({
                error: `Choose a trial length of ${settings.domainMonths.join(', ')} month(s)`,
                code: 'MONTHS_INVALID',
                allowed: settings.domainMonths,
            });
        }
        const trialDays = monthsToDays(clampMonths(months, settings.defaultMonths));

        // Link back to the demo this came from (prefill + funnel). Only accept a
        // demo owned by the same email so tokens can't be used to spoof lead history.
        let sourceId = null;
        let sourceDemo = null;
        if (sourceRequestId) {
            const src = await pool.query(
                `SELECT id, created_at FROM trial_requests
                  WHERE (id = $1 OR public_token = $1) AND email = $2 AND trial_type = 'hosted' LIMIT 1`,
                [String(sourceRequestId), normalizedEmail]
            );
            if (src.rows.length) {
                sourceId = src.rows[0].id;
                sourceDemo = src.rows[0];
            }
        }

        const stage = initialStageFor(gate.value.hostingSource);
        const history = [{ stage, at: new Date().toISOString(), by: null, note: 'customer request' }];

        await pool.query(
            `INSERT INTO trial_requests (
               id, public_token, product_id, trial_type, customer_name, email, phone,
               company, desired_domain, use_case, requested_days, requested_months,
               hosting_source, host_kind, has_hosting, fulfillment_stage, stage_history,
               source_request_id, ip_address
             ) VALUES ($1,$2,$3,'self_hosted',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
            [
                id, publicToken, product.id, cleanName, normalizedEmail, cleanPhone,
                company || null, gate.value.desiredDomain, useCase || null, trialDays, months,
                gate.value.hostingSource, gate.value.hostKind, gate.value.hasHosting, stage, JSON.stringify(history),
                sourceId, ip,
            ]
        );

        res.status(201).json({
            ok: true,
            path: 'domain',
            requestId: id,
            statusToken: publicToken,
            statusUrl,
            status: 'pending',
            fulfillmentStage: stage,
            requestedMonths: months,
            trialDays,
            hostingSource: gate.value.hostingSource,
            hostKind: gate.value.hostKind,
            desiredDomain: gate.value.desiredDomain,
            slaHours: settings.fulfillmentSlaHours,
            message: gate.value.hostingSource === 'buy_from_trialvo'
                ? 'Request received. We will contact you about hosting, then deploy.'
                : `Request received. We usually deploy within ${settings.fulfillmentSlaHours} hours.`,
        });

        // Customer ack + staff alert off the request path.
        setImmediate(() => {
            (async () => {
                const requestRow = {
                    id, customer_name: cleanName, email: normalizedEmail, phone: cleanPhone,
                    desired_domain: gate.value.desiredDomain, hosting_source: gate.value.hostingSource,
                    host_kind: gate.value.hostKind, requested_months: months, requested_days: trialDays, use_case: useCase,
                };
                try {
                    const mail = domainTrialReceivedEmail({
                        name: cleanName, productName, months,
                        domain: gate.value.desiredDomain, hostingSource: gate.value.hostingSource,
                        hostKind: gate.value.hostKind, slaHours: settings.fulfillmentSlaHours, statusUrl,
                    });
                    await sendMail({ to: normalizedEmail, ...mail });
                } catch (e) {
                    console.error(`[trial] domain ack email failed for ${id}:`, e.message || e);
                }
                await notifyStaffNewDomainTrial(requestRow, product, {
                    slaHours: settings.fulfillmentSlaHours,
                    sourceDemo,
                });
            })();
        });
    } catch (err) {
        next(err);
    }
}

async function getPublicTrialConfig(req, res, next) {
    try {
        const settings = await getTrialSettings();
        res.json(toPublicConfig(settings));
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
                    ti.expires_at AS instance_expires, ti.status AS instance_status, ti.meta AS instance_meta,
                    ti.provision_mode, ti.instance_kind,
                    src.public_token AS source_token, src.created_at AS source_created_at
             FROM trial_requests tr
             JOIN products p ON p.id = tr.product_id
             LEFT JOIN trial_instances ti ON ti.request_id = tr.id
             LEFT JOIN trial_requests src ON src.id = tr.source_request_id
             WHERE tr.public_token = $1
             ORDER BY ti.created_at DESC
             LIMIT 1`,
            [token]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const r = rows[0];
        let instanceMeta = r.instance_meta;
        if (typeof instanceMeta === 'string') {
            try { instanceMeta = JSON.parse(instanceMeta); } catch { instanceMeta = {}; }
        }
        const sharedDemo = Boolean(instanceMeta?.sharedDemo);
        const settings = await getTrialSettings();
        const path = r.trial_type === 'hosted' ? 'demo' : 'domain';

        // Sibling domain request from this demo (so the hub can say "you already asked").
        let linkedDomainRequest = null;
        if (path === 'demo') {
            const linked = await pool.query(
                `SELECT public_token, fulfillment_stage, status, created_at
                   FROM trial_requests WHERE source_request_id = $1 ORDER BY created_at DESC LIMIT 1`,
                [r.id]
            );
            if (linked.rows.length) {
                linkedDomainRequest = {
                    statusToken: linked.rows[0].public_token,
                    fulfillmentStage: linked.rows[0].fulfillment_stage,
                    status: linked.rows[0].status,
                    requestedAt: linked.rows[0].created_at,
                };
            }
        }

        const expiresAt = r.instance_expires || null;
        const daysLeft = expiresAt
            ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
            : null;

        const payload = {
            path,
            status: r.status,
            trialType: r.trial_type,
            productName: r.product_name,
            productSlug: r.product_slug,
            email: r.email || null,
            customerName: r.customer_name || null,
            requestedAt: r.created_at,
            approvedAt: r.approved_at,
            trialDays: r.requested_days,
            requestedMonths: r.requested_months,
            expiresAt,
            daysLeft,
            shopUrl: r.shop_url,
            adminUrl: r.admin_url,
            apiUrl: r.api_url,
            instanceStatus: r.instance_status,
            instanceId: r.instance_id || null,
            instanceKind: r.instance_kind || null,
            provisionMode: r.provision_mode || (sharedDemo ? 'shared' : null),
            sharedDemo,
            disclaimer: sharedDemo
                ? (instanceMeta?.disclaimer || 'Shared demo — product data may be visible to other trial users')
                : null,

            // Own-domain pipeline
            fulfillmentStage: r.fulfillment_stage || null,
            stageHistory: parseHistory(r.stage_history),
            hostingSource: r.hosting_source || null,
            hostKind: r.host_kind || null,
            desiredDomain: r.desired_domain || null,
            slaHours: settings.fulfillmentSlaHours,
            pickedUpAt: r.picked_up_at || null,
            fulfilledAt: r.fulfilled_at || null,

            // Cross-links between the two paths
            sourceDemo: r.source_token ? { statusToken: r.source_token, startedAt: r.source_created_at } : null,
            linkedDomainRequest,
            domainTrialOffer: settings.domainEnabled
                ? { months: settings.domainMonths, maxMonths: settings.domainMonths[settings.domainMonths.length - 1] }
                : null,
        };

        // Expose credentials when instance exists (token-gated page)
        if (r.instance_id && r.admin_email) {
            payload.credentials = {
                adminEmail: r.admin_email,
                adminPassword: r.admin_password_enc ? decrypt(r.admin_password_enc) : null,
            };
            // Installer only makes sense for agent-mode self-hosted trials, never for
            // staff-deployed ones (nothing to install) or shared demos.
            if (r.trial_type === 'self_hosted' && r.provision_mode !== 'manual') {
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
