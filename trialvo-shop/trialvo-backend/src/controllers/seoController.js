const { pool } = require('../config/db');
const { notifySeoChange, isEnabled } = require('../services/seoNotify');

/**
 * GET /api/admin/seo/status — whether instant indexing is wired up.
 * Lets the admin panel show why a resubmit would be a no-op.
 */
async function getSeoStatus(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT COUNT(*)::int AS count FROM products WHERE is_active = 1'
        );
        res.json({
            enabled: isEnabled(),
            activeProducts: rows[0]?.count ?? 0,
            frontendUrl: process.env.FRONTEND_URL || null,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/admin/seo/resubmit — manual resubmission of the whole catalog.
 * Useful after a bulk import or a domain change, when per-product hooks did
 * not fire.
 */
async function resubmitSeo(req, res, next) {
    try {
        if (!isEnabled()) {
            return res.status(501).json({
                error: 'SEO_REVALIDATE_SECRET is not configured on the backend',
            });
        }

        const { rows } = await pool.query(
            'SELECT slug FROM products WHERE is_active = 1'
        );

        const result = await notifySeoChange({
            slugs: rows.map((row) => row.slug),
            all: true,
        });

        res.json({ products: rows.length, result });
    } catch (error) {
        next(error);
    }
}

module.exports = { getSeoStatus, resubmitSeo };
