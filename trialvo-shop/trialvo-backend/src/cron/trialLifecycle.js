const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { logEvent } = require('../services/trialEvents');
const { sendMail } = require('../services/mailer');
const { trialExpiryReminderEmail, FRONTEND } = require('../services/trialEmails');

/** Days after expiry before auto soft-destroy for trials only (env override). */
const DESTROY_AFTER_DAYS = parseInt(process.env.TRIAL_DESTROY_AFTER_DAYS || '7', 10);
/**
 * Paid/unlicensed auto soft-destroy. Default 0 = never destroy paid seats via cron
 * (freeze on expiry only). Set >0 to enable delayed destroy for paid too.
 */
const PAID_DESTROY_AFTER_DAYS = parseInt(process.env.PAID_DESTROY_AFTER_DAYS || '0', 10);

const TRIAL_KIND_SQL = `(instance_kind IS NULL OR instance_kind = 'trial')`;
const PAID_KIND_SQL = `instance_kind IN ('paid', 'unlicensed')`;

async function expireActiveTrials() {
    // Trials: mark expired + freeze (or shared-demo revoke)
    const expired = await pool.query(
        `SELECT id, admin_email, meta, trial_type, instance_kind FROM trial_instances
         WHERE status = 'active'
           AND expires_at IS NOT NULL AND expires_at < NOW()
           AND ${TRIAL_KIND_SQL}`
    );
    const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

    for (const row of expired.rows) {
        await pool.query("UPDATE trial_instances SET status = 'expired', updated_at = NOW() WHERE id = $1", [row.id]);

        if (isSharedDemoInstance(row)) {
            const rev = await revokeTrialAdmin({ email: row.admin_email, instance: row });
            await logEvent(row.id, 'shared_demo_auto_expired', { revoke: rev });
            continue;
        }

        await pool.query(
            'INSERT INTO remote_commands (id, instance_id, command, status) VALUES ($1,$2,$3,$4)',
            [uuidv4(), row.id, 'freeze', 'pending']
        );
        await logEvent(row.id, 'auto_expired', null);
    }

    // Paid/unlicensed: freeze only — never auto-destroy unless PAID_DESTROY_AFTER_DAYS > 0 later
    const paidExpired = await pool.query(
        `SELECT id, instance_kind FROM trial_instances
         WHERE status = 'active'
           AND expires_at IS NOT NULL AND expires_at < NOW()
           AND ${PAID_KIND_SQL}`
    );
    for (const row of paidExpired.rows) {
        await pool.query(
            `UPDATE trial_instances SET status = 'frozen', frozen_at = COALESCE(frozen_at, NOW()), updated_at = NOW() WHERE id = $1`,
            [row.id]
        );
        await pool.query(
            'INSERT INTO remote_commands (id, instance_id, command, status) VALUES ($1,$2,$3,$4)',
            [uuidv4(), row.id, 'freeze', 'pending']
        );
        await logEvent(row.id, 'paid_seat_expired_frozen', { kind: row.instance_kind });
    }

    const total = expired.rows.length + paidExpired.rows.length;
    if (total) {
        console.log(
            `[trialLifecycle] Expired ${expired.rows.length} trial(s); froze ${paidExpired.rows.length} paid/unlicensed seat(s)`
        );
    }
    return total;
}

/**
 * Soft-destroy trials that stayed expired for DESTROY_AFTER_DAYS.
 * Paid seats: only if PAID_DESTROY_AFTER_DAYS > 0.
 */
async function destroyStaleExpiredTrials() {
    const { isSharedDemoInstance, revokeTrialAdmin } = require('../services/sharedDemoProvisioner');

    const { rows } = await pool.query(
        `SELECT id, admin_email, meta, trial_type, instance_kind FROM trial_instances
         WHERE status = 'expired'
           AND ${TRIAL_KIND_SQL}
           AND expires_at IS NOT NULL
           AND expires_at < DATE_SUB(NOW(), INTERVAL ? DAY)
           AND NOT EXISTS (
             SELECT 1 FROM remote_commands rc
             WHERE rc.instance_id = trial_instances.id
               AND rc.command IN ('destroy_soft', 'destroy_hard')
               AND rc.status IN ('pending', 'sent', 'succeeded')
           )`,
        [DESTROY_AFTER_DAYS]
    );

    for (const row of rows) {
        if (isSharedDemoInstance(row)) {
            const rev = await revokeTrialAdmin({ email: row.admin_email, instance: row });
            await pool.query(
                "UPDATE trial_instances SET status = 'destroyed', updated_at = NOW() WHERE id = $1",
                [row.id]
            );
            await logEvent(row.id, 'shared_demo_auto_destroyed', { afterDays: DESTROY_AFTER_DAYS, revoke: rev });
            continue;
        }

        await pool.query(
            "UPDATE trial_instances SET status = 'destroying', updated_at = NOW() WHERE id = $1",
            [row.id]
        );
        await pool.query(
            `INSERT INTO remote_commands (id, instance_id, command, payload, status)
             VALUES ($1, $2, 'destroy_soft', $3, 'pending')`,
            [uuidv4(), row.id, JSON.stringify({ mode: 'soft', trigger: 'auto_stale' })]
        );
        await logEvent(row.id, 'auto_destroy_queued', { afterDays: DESTROY_AFTER_DAYS });
    }

    let paidDestroyed = 0;
    if (PAID_DESTROY_AFTER_DAYS > 0) {
        const { rows: paidRows } = await pool.query(
            `SELECT id, instance_kind FROM trial_instances
             WHERE status = 'frozen'
               AND ${PAID_KIND_SQL}
               AND expires_at IS NOT NULL
               AND expires_at < DATE_SUB(NOW(), INTERVAL ? DAY)
               AND NOT EXISTS (
                 SELECT 1 FROM remote_commands rc
                 WHERE rc.instance_id = trial_instances.id
                   AND rc.command IN ('destroy_soft', 'destroy_hard')
                   AND rc.status IN ('pending', 'sent', 'succeeded')
               )`,
            [PAID_DESTROY_AFTER_DAYS]
        );
        for (const row of paidRows) {
            await pool.query(
                "UPDATE trial_instances SET status = 'destroying', updated_at = NOW() WHERE id = $1",
                [row.id]
            );
            await pool.query(
                `INSERT INTO remote_commands (id, instance_id, command, payload, status)
                 VALUES ($1, $2, 'destroy_soft', $3, 'pending')`,
                [uuidv4(), row.id, JSON.stringify({ mode: 'soft', trigger: 'paid_stale' })]
            );
            await logEvent(row.id, 'paid_auto_destroy_queued', { afterDays: PAID_DESTROY_AFTER_DAYS });
            paidDestroyed += 1;
        }
    }

    if (rows.length || paidDestroyed) {
        console.log(
            `[trialLifecycle] Queued soft-destroy for ${rows.length} trial(s)` +
                (paidDestroyed ? `, ${paidDestroyed} paid` : '')
        );
    }
    return rows.length + paidDestroyed;
}

async function sendExpiryReminders() {
    const { rows } = await pool.query(
        `SELECT ti.id, ti.expires_at, ti.meta, ti.shop_url,
                tr.customer_name, tr.email, tr.public_token,
                p.name AS product_name
         FROM trial_instances ti
         JOIN trial_requests tr ON tr.id = ti.request_id
         JOIN products p ON p.id = ti.product_id
         WHERE ti.status = 'active'
           AND ${TRIAL_KIND_SQL.replace(/instance_kind/g, 'ti.instance_kind')}
           AND ti.expires_at IS NOT NULL
           AND ti.expires_at > NOW()
           AND ti.expires_at <= DATE_ADD(NOW(), INTERVAL 3 DAY)`
    );

    let sent = 0;
    const now = Date.now();

    for (const row of rows) {
        const expiresMs = new Date(row.expires_at).getTime();
        const daysLeft = Math.max(1, Math.ceil((expiresMs - now) / 86400000));
        const meta = (typeof row.meta === 'object' && row.meta) ? { ...row.meta } : {};

        const wantT1 = daysLeft <= 1;
        const wantT3 = daysLeft <= 3 && daysLeft > 1;

        let kind = null;
        if (wantT1 && !meta.reminder_t1_sent) kind = 't1';
        else if (wantT3 && !meta.reminder_t3_sent) kind = 't3';

        if (!kind) continue;

        const productLabel = row.product_name?.en || row.product_name?.bn || row.product_name || 'your product';
        const statusUrl = `${FRONTEND}/trial-status/${row.public_token}`;
        const mail = trialExpiryReminderEmail({
            name: row.customer_name,
            daysLeft: kind === 't1' ? 1 : daysLeft,
            productName: typeof productLabel === 'string' ? productLabel : 'your product',
            statusUrl,
            expiresAt: row.expires_at,
        });

        await sendMail({ to: row.email, ...mail });

        if (kind === 't1') meta.reminder_t1_sent = true;
        else meta.reminder_t3_sent = true;
        meta[`reminder_${kind}_at`] = new Date().toISOString();

        await pool.query(
            'UPDATE trial_instances SET meta = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(meta), row.id]
        );
        await logEvent(row.id, `reminder_${kind}`, { daysLeft, to: row.email });
        sent += 1;
    }

    if (sent) console.log(`[trialLifecycle] Sent ${sent} expiry reminder(s)`);
    return sent;
}

async function runTrialLifecycle() {
    await expireActiveTrials();
    await sendExpiryReminders();
    await destroyStaleExpiredTrials();
}

function startTrialLifecycleCron() {
    const cron = require('node-cron');
    cron.schedule('0 * * * *', () => {
        runTrialLifecycle().catch((e) => console.error('[trialLifecycle]', e.message));
    });
    console.log('[trialLifecycle] Hourly expiry + reminder + destroy check scheduled');
}

module.exports = {
    runTrialLifecycle,
    expireActiveTrials,
    sendExpiryReminders,
    destroyStaleExpiredTrials,
    startTrialLifecycleCron,
};
