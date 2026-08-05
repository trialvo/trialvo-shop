/**
 * controllers/review.js — V2-042
 * Product Review & Rating System.
 *
 * User endpoints: submit, edit, delete reviews; check eligibility.
 * Admin endpoints: list, reply, pin, hide, delete reviews.
 */

'use strict';

const { api, auth, userAuth, verifyJwt } = require('../helpers/common');
const { saveReviewImage, reviewUploadApi, deleteFileIfExists } = require('../helpers/img');
const errors = require('../helpers/errors');
const { jwtSecret, BRAND_NAME, SHOP_URL, BRAND_ADDRESS } = require('../config/ApplicationSettings');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Recalculate avg_rating & review_count for a product and persist.
 */
async function refreshProductRatingCache(conn, productId) {
    await conn.query(
        `UPDATE products p SET
            p.avg_rating = COALESCE(
                (SELECT ROUND(AVG(pr.rating), 2)
                 FROM product_reviews pr
                 WHERE pr.product_id = p.id AND pr.deleted_at IS NULL AND pr.is_hidden = 0 AND pr.rating IS NOT NULL),
            0),
            p.review_count = COALESCE(
                (SELECT COUNT(*)
                 FROM product_reviews pr
                 WHERE pr.product_id = p.id AND pr.deleted_at IS NULL AND pr.is_hidden = 0 AND pr.rating IS NOT NULL),
            0)
         WHERE p.id = ?`,
        [productId]
    );
}

/**
 * Save uploaded review images (from req.files.review_images) to storage.
 * Returns array of { image_path, serial }.
 */
async function processReviewImages(req, folderPath) {
    const files = (req.files && req.files.review_images) || [];
    const savedImages = [];
    for (let i = 0; i < files.length; i++) {
        const savedPath = await saveReviewImage(files[i].path, folderPath);
        savedImages.push({ image_path: savedPath, serial: i + 1 });
    }
    return savedImages;
}

/**
 * Optionally extract authenticated user info from JWT.
 * Returns { userId, isAuthenticated } or nulls.
 */
async function optionalAuth(req, connection) {
    let userId = null;
    let isAuthenticated = false;
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = await verifyJwt(token, jwtSecret);
            if (decoded?.uid) {
                const user = await connection.queryOne(
                    `SELECT id, status, is_email_verified, token_version FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL`,
                    [decoded.uid]
                );
                if (user && user.is_email_verified && decoded.ev === true && decoded.tv === user.token_version) {
                    userId = user.id;
                    isAuthenticated = true;
                }
            }
        }
    } catch { /* silent */ }
    return { userId, isAuthenticated };
}


// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC / USER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /user/product/:product_id/reviews
 * Paginated review list for a product.
 * Pinned reviews first, then by date descending.
 * Includes star breakdown and average.
 */
exports.getProductReviews = api({
    params: { product_id: { type: 'int', required: true } },
    query: {
        rating: { type: 'int' },       // filter by specific star
        limit: { type: 'int', default: 10 },
        offset: { type: 'int', default: 0 },
        sort_by: { type: 'string', default: 'created_at' },
        sort_order: { type: 'string', default: 'DESC' }
    }
}, async (req, connection) => {
    const { product_id } = req.typed.params;
    const q = req.typed.query;
    const limit = Math.min(Math.max(q.limit, 1), 50);
    const offset = Math.max(q.offset, 0);

    // Star breakdown (only rated reviews)
    const breakdown = await connection.query(
        `SELECT rating, COUNT(*) as count
         FROM product_reviews
         WHERE product_id = ? AND deleted_at IS NULL AND is_hidden = 0 AND rating IS NOT NULL
         GROUP BY rating`,
        [product_id]
    );

    const starBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalReviews = 0;
    let sumRating = 0;
    for (const row of breakdown) {
        starBreakdown[row.rating] = row.count;
        totalReviews += row.count;
        sumRating += row.rating * row.count;
    }
    const avgRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 0;

    // Filters
    const filters = ['pr.product_id = ?', 'pr.deleted_at IS NULL', 'pr.is_hidden = 0'];
    const values = [product_id];

    if (q.rating !== undefined && q.rating >= 1 && q.rating <= 5) {
        filters.push('pr.rating = ?');
        values.push(q.rating);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    // Total matching
    const [{ total }] = await connection.query(
        `SELECT COUNT(*) as total FROM product_reviews pr ${whereClause}`,
        values
    );

    // Fetch reviews
    const validSort = ['created_at', 'rating'];
    const sortBy = validSort.includes(q.sort_by) ? q.sort_by : 'created_at';
    const sortOrder = q.sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // When sorting by rating, push NULL ratings (comments) to the bottom
    const orderByRating = sortBy === 'rating'
        ? `pr.is_pinned DESC, pr.rating IS NULL ASC, pr.rating ${sortOrder}`
        : `pr.is_pinned DESC, pr.${sortBy} ${sortOrder}`;

    const reviews = await connection.query(
        `SELECT pr.id, pr.rating, pr.review_text, pr.is_pinned, pr.mentions_seller,
                pr.created_at, pr.updated_at,
                u.id as user_id,
                CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) as user_name,
                u.img_path as user_avatar,
                oi.product_name as purchased_product_name,
                oi.color_name as purchased_color,
                oi.variant_name as purchased_variant,
                (pr.order_item_id IS NOT NULL OR EXISTS(
                    SELECT 1 FROM order_items oi2
                    INNER JOIN orders o2 ON o2.id = oi2.order_id
                    WHERE oi2.product_id = pr.product_id
                      AND o2.customer_id = pr.user_id
                      AND o2.order_status = 'delivered'
                      AND o2.deleted_at IS NULL
                )) as is_verified_buyer
         FROM product_reviews pr
         INNER JOIN users u ON u.id = pr.user_id
         LEFT JOIN order_items oi ON oi.id = pr.order_item_id
         ${whereClause}
         ORDER BY ${orderByRating}
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
    );

    if (reviews.length > 0) {
        const reviewIds = reviews.map(r => r.id);

        // Batch fetch images
        const images = await connection.query(
            `SELECT review_id, image_path, serial FROM review_images
             WHERE review_id IN (?) AND reply_id IS NULL
             ORDER BY serial ASC`,
            [reviewIds]
        );

        // Batch fetch replies
        const replies = await connection.query(
            `SELECT rr.id, rr.review_id, rr.reply_text, rr.created_at,
                    CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) as admin_name
             FROM review_replies rr
             INNER JOIN admins a ON a.id = rr.admin_id
             WHERE rr.review_id IN (?) AND rr.deleted_at IS NULL
             ORDER BY rr.created_at ASC`,
            [reviewIds]
        );

        // Batch fetch reply images
        const replyIds = replies.map(r => r.id);
        let replyImages = [];
        if (replyIds.length > 0) {
            replyImages = await connection.query(
                `SELECT reply_id, image_path, serial FROM review_images
                 WHERE reply_id IN (?)
                 ORDER BY serial ASC`,
                [replyIds]
            );
        }

        // Attach to reviews
        for (const review of reviews) {
            review.images = images.filter(img => img.review_id === review.id);
            review.replies = replies
                .filter(r => r.review_id === review.id)
                .map(r => ({
                    ...r,
                    images: replyImages.filter(ri => ri.reply_id === r.id)
                }));
            review.is_pinned = !!review.is_pinned;
            review.mentions_seller = !!review.mentions_seller;
        }
    }

    return {
        success: true,
        product_id,
        avg_rating: avgRating,
        total_reviews: totalReviews,
        star_breakdown: starBreakdown,
        total,
        limit,
        offset,
        reviews
    };
});


/**
 * GET /user/product/:product_id/review-eligibility
 * Check which delivered order items the current user can review for a product.
 */
exports.getReviewEligibility = api({
    params: { product_id: { type: 'int', required: true } }
}, userAuth(async (req, connection, userInfo) => {
    const productId = req.typed.params.product_id;
    const userId = userInfo.id;

    const eligibleItems = await connection.query(
        `SELECT oi.id as order_item_id, oi.order_id,
                oi.product_name, oi.color_name, oi.variant_name,
                oi.product_image, o.delivered_at,
                (SELECT pr.id FROM product_reviews pr WHERE pr.order_item_id = oi.id AND pr.deleted_at IS NULL LIMIT 1) as existing_review_id
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.customer_id = ?
           AND oi.product_id = ?
           AND o.order_status = 'delivered'
           AND o.deleted_at IS NULL
         ORDER BY o.delivered_at DESC`,
        [userId, productId]
    );

    return {
        success: true,
        eligible_items: eligibleItems.map(item => ({
            ...item,
            can_review: item.existing_review_id === null,
            existing_review_id: item.existing_review_id || null
        }))
    };
}));


/**
 * POST /user/review
 * Submit a review (rated, tied to a purchase) or a comment (text-only, no purchase required).
 * - If `rating` + `order_item_id` are provided → full rated review (purchase verified)
 * - If neither → comment-only (just needs auth)
 */
exports.submitReview = reviewUploadApi({
    body: {
        product_id: { type: 'int', required: true },
        order_item_id: { type: 'int' },
        rating: { type: 'int' },
        review_text: { type: 'string' }
    }
}, userAuth(async (req, connection, userInfo) => {
    const { product_id, order_item_id, rating, review_text } = req.typed.body;
    const userId = userInfo.id;

    const isRatedReview = rating !== undefined && rating !== null;

    // ── Rated review path: needs purchase ──
    if (isRatedReview) {
        if (rating < 1 || rating > 5) throw new errors.BAD_REQUEST('Rating must be between 1 and 5.');
        if (!order_item_id) throw new errors.BAD_REQUEST('order_item_id is required for a rated review.');

        // Verify ownership
        const item = await connection.queryOne(
            `SELECT oi.id, oi.order_id, oi.product_id
             FROM order_items oi
             INNER JOIN orders o ON o.id = oi.order_id
             WHERE oi.id = ?
               AND o.customer_id = ?
               AND oi.product_id = ?
               AND o.order_status = 'delivered'
               AND o.deleted_at IS NULL`,
            [order_item_id, userId, product_id]
        );
        if (!item) throw new errors.BAD_REQUEST('You can only rate products from your delivered orders.');

        // Check existing rated review on this order item
        const existing = await connection.queryOne(
            `SELECT id FROM product_reviews WHERE order_item_id = ? AND deleted_at IS NULL`,
            [order_item_id]
        );
        if (existing) throw new errors.BAD_REQUEST('You have already reviewed this purchase.');
    }

    // ── Comment-only path: just needs text ──
    if (!isRatedReview) {
        if (!review_text || !review_text.trim()) {
            throw new errors.BAD_REQUEST('Please write a comment.');
        }
    }

    // Detect @seller mention
    const mentionsSeller = (review_text || '').toLowerCase().includes('@seller') ? 1 : 0;

    // ─── Begin transaction ───
    await connection.query('START TRANSACTION');

    try {
        const orderId = isRatedReview ? (await connection.queryOne(
            'SELECT order_id FROM order_items WHERE id = ?', [order_item_id]
        ))?.order_id : null;

        // Insert review
        const result = await connection.query(
            `INSERT INTO product_reviews (product_id, user_id, order_id, order_item_id, rating, review_text, mentions_seller)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [product_id, userId, orderId, order_item_id || null, isRatedReview ? rating : null, review_text || null, mentionsSeller]
        );
        const reviewId = result.insertId;

        // Save images
        const savedImages = await processReviewImages(req, `reviews/${reviewId}`);
        for (const img of savedImages) {
            await connection.query(
                `INSERT INTO review_images (review_id, reply_id, image_path, serial) VALUES (?, NULL, ?, ?)`,
                [reviewId, img.image_path, img.serial]
            );
        }

        // If @seller mentioned → create report
        let reportId = null;
        if (mentionsSeller) {
            try {
                const reportResult = await connection.query(
                    `INSERT INTO reports (user_id, category, subject, message, tracking_token, status)
                     VALUES (?, 'review_escalation', ?, ?, ?, 'open')`,
                    [
                        userId,
                        `Review Escalation – Product #${product_id}`,
                        `[Auto-generated from review #${reviewId}] ${review_text || ''}`.substring(0, 2000),
                        require('crypto').randomBytes(16).toString('hex')
                    ]
                );
                reportId = reportResult.insertId;
                await connection.query(
                    `UPDATE product_reviews SET report_id = ? WHERE id = ?`,
                    [reportId, reviewId]
                );
            } catch (reportErr) {
                console.error('[Review] Seller mention report creation failed:', reportErr.message);
            }
        }

        // Refresh product rating cache (only if rated)
        if (isRatedReview) {
            await refreshProductRatingCache(connection, product_id);
        }

        await connection.query('COMMIT');

        return { success: true, review_id: reviewId, report_id: reportId };

    } catch (err) {
        await connection.query('ROLLBACK');
        throw err;
    }
}));


/**
 * PUT /user/review/:id
 * Edit own review (only if no admin reply yet).
 */
exports.editReview = reviewUploadApi({
    params: { id: { type: 'int', required: true } },
    body: {
        rating: { type: 'int' },
        review_text: { type: 'string' }
    }
}, userAuth(async (req, connection, userInfo) => {
    const reviewId = req.typed.params.id;
    const { rating, review_text } = req.typed.body;

    const review = await connection.queryOne(
        `SELECT pr.id, pr.product_id, pr.user_id
         FROM product_reviews pr
         WHERE pr.id = ? AND pr.deleted_at IS NULL`,
        [reviewId]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');
    if (review.user_id !== userInfo.id) throw new errors.UNAUTHORIZED('Cannot edit another user\'s review.');

    // Check if admin has replied (lock after admin reply)
    const hasReply = await connection.queryOne(
        `SELECT id FROM review_replies WHERE review_id = ? AND deleted_at IS NULL LIMIT 1`,
        [reviewId]
    );
    if (hasReply) throw new errors.BAD_REQUEST('Cannot edit review after admin has responded.');

    if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new errors.BAD_REQUEST('Rating must be between 1 and 5.');
    }

    const updates = [];
    const vals = [];
    if (rating !== undefined) { updates.push('rating = ?'); vals.push(rating); }
    if (review_text !== undefined) {
        updates.push('review_text = ?');
        vals.push(review_text);
        updates.push('mentions_seller = ?');
        vals.push((review_text || '').toLowerCase().includes('@seller') ? 1 : 0);
    }

    if (updates.length === 0 && !(req.files && req.files.review_images && req.files.review_images.length)) {
        throw new errors.BAD_REQUEST('Nothing to update.');
    }

    await connection.query('START TRANSACTION');
    try {
        if (updates.length > 0) {
            await connection.query(
                `UPDATE product_reviews SET ${updates.join(', ')} WHERE id = ?`,
                [...vals, reviewId]
            );
        }

        // Handle new images (replace old ones)
        if (req.files && req.files.review_images && req.files.review_images.length) {
            // Delete old images
            const oldImages = await connection.query(
                `SELECT image_path FROM review_images WHERE review_id = ? AND reply_id IS NULL`,
                [reviewId]
            );
            for (const img of oldImages) deleteFileIfExists(img.image_path);
            await connection.query(`DELETE FROM review_images WHERE review_id = ? AND reply_id IS NULL`, [reviewId]);

            // Save new images
            const savedImages = await processReviewImages(req, `reviews/${reviewId}`);
            for (const img of savedImages) {
                await connection.query(
                    `INSERT INTO review_images (review_id, reply_id, image_path, serial) VALUES (?, NULL, ?, ?)`,
                    [reviewId, img.image_path, img.serial]
                );
            }
        }

        await refreshProductRatingCache(connection, review.product_id);
        await connection.query('COMMIT');

        return { success: true, message: 'Review updated.' };
    } catch (err) {
        await connection.query('ROLLBACK');
        throw err;
    }
}));


/**
 * DELETE /user/review/:id
 * Soft-delete own review.
 */
exports.deleteOwnReview = api({
    params: { id: { type: 'int', required: true } }
}, userAuth(async (req, connection, userInfo) => {
    const reviewId = req.typed.params.id;

    const review = await connection.queryOne(
        `SELECT id, product_id, user_id FROM product_reviews WHERE id = ? AND deleted_at IS NULL`,
        [reviewId]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');
    if (review.user_id !== userInfo.id) throw new errors.UNAUTHORIZED('Cannot delete another user\'s review.');

    await connection.query(`UPDATE product_reviews SET deleted_at = NOW() WHERE id = ?`, [reviewId]);
    await refreshProductRatingCache(connection, review.product_id);

    return { success: true, message: 'Review deleted.' };
}));


/**
 * GET /user/my-reviews
 * Get current user's own reviews.
 */
exports.getMyReviews = api({
    query: {
        limit: { type: 'int', default: 10 },
        offset: { type: 'int', default: 0 }
    }
}, userAuth(async (req, connection, userInfo) => {
    const limit = Math.min(Math.max(req.typed.query.limit, 1), 50);
    const offset = Math.max(req.typed.query.offset, 0);

    const [{ total }] = await connection.query(
        `SELECT COUNT(*) as total FROM product_reviews WHERE user_id = ? AND deleted_at IS NULL`,
        [userInfo.id]
    );

    const reviews = await connection.query(
        `SELECT pr.id, pr.product_id, pr.rating, pr.review_text, pr.is_pinned, pr.is_hidden,
                pr.created_at, pr.updated_at,
                p.name as product_name, p.slug as product_slug,
                COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as product_image,
                oi.color_name as purchased_color, oi.variant_name as purchased_variant,
                (SELECT COUNT(*) FROM review_replies rr WHERE rr.review_id = pr.id AND rr.deleted_at IS NULL) as reply_count
         FROM product_reviews pr
         INNER JOIN products p ON p.id = pr.product_id
         INNER JOIN order_items oi ON oi.id = pr.order_item_id
         WHERE pr.user_id = ? AND pr.deleted_at IS NULL
         ORDER BY pr.created_at DESC
         LIMIT ? OFFSET ?`,
        [userInfo.id, limit, offset]
    );

    // Fetch images for these reviews
    if (reviews.length > 0) {
        const reviewIds = reviews.map(r => r.id);
        const images = await connection.query(
            `SELECT review_id, image_path, serial FROM review_images WHERE review_id IN (?) AND reply_id IS NULL ORDER BY serial ASC`,
            [reviewIds]
        );
        for (const review of reviews) {
            review.images = images.filter(img => img.review_id === review.id);
            review.is_pinned = !!review.is_pinned;
            review.is_hidden = !!review.is_hidden;
        }
    }

    return { success: true, total, limit, offset, reviews };
}));


// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

const REVIEW_ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER'];

/**
 * GET /admin/reviews
 * List all reviews across all products.
 */
exports.adminListReviews = api({
    query: {
        product_id: { type: 'int' },
        user_id: { type: 'int' },
        rating: { type: 'int' },
        status: { type: 'string' },         // published, hidden, flagged
        is_hidden: { type: 'bool' },
        is_pinned: { type: 'bool' },
        mentions_seller: { type: 'bool' },
        search: { type: 'string' },
        limit: { type: 'int', default: 20 },
        offset: { type: 'int', default: 0 },
        sort_by: { type: 'string', default: 'created_at' },
        sort_order: { type: 'string', default: 'DESC' }
    }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const q = req.typed.query;
    const limit = Math.min(Math.max(q.limit, 1), 50);
    const offset = Math.max(q.offset, 0);

    const filters = ['pr.deleted_at IS NULL'];
    const values = [];

    if (q.product_id !== undefined) { filters.push('pr.product_id = ?'); values.push(q.product_id); }
    if (q.user_id !== undefined) { filters.push('pr.user_id = ?'); values.push(q.user_id); }
    if (q.rating !== undefined && q.rating >= 1 && q.rating <= 5) { filters.push('pr.rating = ?'); values.push(q.rating); }
    if (q.status) { filters.push('pr.status = ?'); values.push(q.status); }
    if (q.is_hidden !== undefined) { filters.push('pr.is_hidden = ?'); values.push(q.is_hidden ? 1 : 0); }
    if (q.is_pinned !== undefined) { filters.push('pr.is_pinned = ?'); values.push(q.is_pinned ? 1 : 0); }
    if (q.mentions_seller !== undefined) { filters.push('pr.mentions_seller = ?'); values.push(q.mentions_seller ? 1 : 0); }
    if (q.search) {
        filters.push('(pr.review_text LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR p.name LIKE ?)');
        values.push(`%${q.search}%`, `%${q.search}%`, `%${q.search}%`, `%${q.search}%`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [{ total }] = await connection.query(
        `SELECT COUNT(*) as total
         FROM product_reviews pr
         INNER JOIN users u ON u.id = pr.user_id
         INNER JOIN products p ON p.id = pr.product_id
         ${whereClause}`,
        values
    );

    const validSort = ['created_at', 'rating'];
    const sortBy = validSort.includes(q.sort_by) ? q.sort_by : 'created_at';
    const sortOrder = q.sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const reviews = await connection.query(
        `SELECT pr.id, pr.product_id, pr.rating, pr.review_text, pr.is_pinned, pr.is_hidden,
                pr.mentions_seller, pr.report_id, pr.status, pr.created_at, pr.updated_at,
                u.id as user_id,
                CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) as user_name,
                u.email as user_email,
                p.name as product_name, p.slug as product_slug,
                COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as product_image,
                oi.color_name as purchased_color, oi.variant_name as purchased_variant,
                (SELECT COUNT(*) FROM review_replies rr WHERE rr.review_id = pr.id AND rr.deleted_at IS NULL) as reply_count,
                (pr.order_item_id IS NOT NULL OR EXISTS(
                    SELECT 1 FROM order_items oi2
                    INNER JOIN orders o2 ON o2.id = oi2.order_id
                    WHERE oi2.product_id = pr.product_id
                      AND o2.customer_id = pr.user_id
                      AND o2.order_status = 'delivered'
                      AND o2.deleted_at IS NULL
                )) as is_verified_buyer
         FROM product_reviews pr
         INNER JOIN users u ON u.id = pr.user_id
         INNER JOIN products p ON p.id = pr.product_id
         LEFT JOIN order_items oi ON oi.id = pr.order_item_id
         ${whereClause}
         ORDER BY pr.${sortBy} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
    );

    // Batch images
    if (reviews.length > 0) {
        const reviewIds = reviews.map(r => r.id);
        const images = await connection.query(
            `SELECT review_id, image_path, serial FROM review_images WHERE review_id IN (?) AND reply_id IS NULL ORDER BY serial ASC`,
            [reviewIds]
        );
        for (const review of reviews) {
            review.images = images.filter(img => img.review_id === review.id);
            review.is_pinned = !!review.is_pinned;
            review.is_hidden = !!review.is_hidden;
            review.mentions_seller = !!review.mentions_seller;
        }
    }

    return { success: true, total, limit, offset, reviews };
}));


/**
 * GET /admin/reviews/:id
 * Single review with all replies & images.
 */
exports.adminGetReview = api({
    params: { id: { type: 'int', required: true } }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const review = await connection.queryOne(
        `SELECT pr.*,
                u.id as user_id,
                CONCAT(u.first_name, ' ', IFNULL(u.last_name, '')) as user_name,
                u.email as user_email,
                u.img_path as user_avatar,
                p.name as product_name, p.slug as product_slug,
                COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as product_image,
                oi.product_name as purchased_product_name, oi.color_name as purchased_color, oi.variant_name as purchased_variant,
                (pr.order_item_id IS NOT NULL OR EXISTS(
                    SELECT 1 FROM order_items oi2
                    INNER JOIN orders o2 ON o2.id = oi2.order_id
                    WHERE oi2.product_id = pr.product_id
                      AND o2.customer_id = pr.user_id
                      AND o2.order_status = 'delivered'
                      AND o2.deleted_at IS NULL
                )) as is_verified_buyer
         FROM product_reviews pr
         INNER JOIN users u ON u.id = pr.user_id
         INNER JOIN products p ON p.id = pr.product_id
         LEFT JOIN order_items oi ON oi.id = pr.order_item_id
         WHERE pr.id = ? AND pr.deleted_at IS NULL`,
        [req.typed.params.id]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');

    // Images
    review.images = await connection.query(
        `SELECT id, image_path, serial FROM review_images WHERE review_id = ? AND reply_id IS NULL ORDER BY serial ASC`,
        [review.id]
    );

    // Replies with images
    const replies = await connection.query(
        `SELECT rr.id, rr.reply_text, rr.created_at,
                CONCAT(a.first_name, ' ', IFNULL(a.last_name, '')) as admin_name,
                a.id as admin_id
         FROM review_replies rr
         INNER JOIN admins a ON a.id = rr.admin_id
         WHERE rr.review_id = ? AND rr.deleted_at IS NULL
         ORDER BY rr.created_at ASC`,
        [review.id]
    );

    if (replies.length > 0) {
        const replyIds = replies.map(r => r.id);
        const replyImages = await connection.query(
            `SELECT reply_id, image_path, serial FROM review_images WHERE reply_id IN (?) ORDER BY serial ASC`,
            [replyIds]
        );
        for (const reply of replies) {
            reply.images = replyImages.filter(ri => ri.reply_id === reply.id);
        }
    }
    review.replies = replies;

    review.is_pinned = !!review.is_pinned;
    review.is_hidden = !!review.is_hidden;
    review.mentions_seller = !!review.mentions_seller;

    return { success: true, review };
}));


/**
 * POST /admin/reviews/:id/reply
 * Admin reply to a review (with optional images).
 * Sends email notification to the user.
 */
exports.adminReplyReview = reviewUploadApi({
    params: { id: { type: 'int', required: true } },
    body: {
        reply_text: { type: 'string', required: true }
    }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const reviewId = req.typed.params.id;
    const { reply_text } = req.typed.body;

    const review = await connection.queryOne(
        `SELECT pr.*, u.email as user_email, u.first_name as user_first_name,
                p.name as product_name, p.slug as product_slug
         FROM product_reviews pr
         INNER JOIN users u ON u.id = pr.user_id
         INNER JOIN products p ON p.id = pr.product_id
         WHERE pr.id = ? AND pr.deleted_at IS NULL`,
        [reviewId]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');

    await connection.query('START TRANSACTION');
    try {
        const result = await connection.query(
            `INSERT INTO review_replies (review_id, admin_id, reply_text) VALUES (?, ?, ?)`,
            [reviewId, adminInfo.id, reply_text]
        );
        const replyId = result.insertId;

        // Save reply images
        const savedImages = await processReviewImages(req, `reviews/${reviewId}/replies/${replyId}`);
        for (const img of savedImages) {
            await connection.query(
                `INSERT INTO review_images (review_id, reply_id, image_path, serial) VALUES (?, ?, ?, ?)`,
                [reviewId, replyId, img.image_path, img.serial]
            );
        }

        // Audit log
        await connection.query(
            `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta, ip_address)
             VALUES (?, 'REVIEW_REPLY', 'product_reviews', ?, ?, ?)`,
            [adminInfo.id, String(reviewId), JSON.stringify({ reply_id: replyId }), req.ip]
        );

        await connection.query('COMMIT');

        // Send email notification (non-blocking)
        if (review.user_email) {
            try {
                const { sendReviewReplyMail } = require('../mail-templates/reviewreply');
                await sendReviewReplyMail(connection, {
                    name: review.user_first_name || 'Customer',
                    email: review.user_email,
                    product_name: review.product_name,
                    product_slug: review.product_slug,
                    rating: review.rating,
                    review_text: review.review_text,
                    reply_text,
                    review_date: review.created_at
                });
            } catch (mailErr) {
                console.error('[Review] Reply email send failed:', mailErr.message);
            }
        }

        return { success: true, reply_id: replyId, message: 'Reply posted.' };

    } catch (err) {
        await connection.query('ROLLBACK');
        throw err;
    }
}));


/**
 * PATCH /admin/reviews/:id/pin
 * Toggle pin status.
 */
exports.adminTogglePin = api({
    params: { id: { type: 'int', required: true } }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const review = await connection.queryOne(
        `SELECT id, is_pinned FROM product_reviews WHERE id = ? AND deleted_at IS NULL`,
        [req.typed.params.id]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');

    const newPinned = review.is_pinned ? 0 : 1;
    await connection.query(`UPDATE product_reviews SET is_pinned = ? WHERE id = ?`, [newPinned, review.id]);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta, ip_address)
         VALUES (?, 'REVIEW_PIN_TOGGLE', 'product_reviews', ?, ?, ?)`,
        [adminInfo.id, String(review.id), JSON.stringify({ is_pinned: !!newPinned }), req.ip]
    );

    return { success: true, is_pinned: !!newPinned };
}));


/**
 * PATCH /admin/reviews/:id/hide
 * Toggle hide status.
 */
exports.adminToggleHide = api({
    params: { id: { type: 'int', required: true } }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const review = await connection.queryOne(
        `SELECT id, is_hidden, product_id FROM product_reviews WHERE id = ? AND deleted_at IS NULL`,
        [req.typed.params.id]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');

    const newHidden = review.is_hidden ? 0 : 1;
    await connection.query(
        `UPDATE product_reviews SET is_hidden = ?, status = ? WHERE id = ?`,
        [newHidden, newHidden ? 'hidden' : 'published', review.id]
    );

    // Recalculate cache (hidden reviews excluded from avg)
    await refreshProductRatingCache(connection, review.product_id);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, meta, ip_address)
         VALUES (?, 'REVIEW_HIDE_TOGGLE', 'product_reviews', ?, ?, ?)`,
        [adminInfo.id, String(review.id), JSON.stringify({ is_hidden: !!newHidden }), req.ip]
    );

    return { success: true, is_hidden: !!newHidden };
}));


/**
 * DELETE /admin/reviews/:id
 * Soft-delete a review.
 */
exports.adminDeleteReview = api({
    params: { id: { type: 'int', required: true } }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const review = await connection.queryOne(
        `SELECT id, product_id FROM product_reviews WHERE id = ? AND deleted_at IS NULL`,
        [req.typed.params.id]
    );
    if (!review) throw new errors.NOT_FOUND('Review not found.');

    await connection.query(`UPDATE product_reviews SET deleted_at = NOW() WHERE id = ?`, [review.id]);
    await refreshProductRatingCache(connection, review.product_id);

    await connection.query(
        `INSERT INTO admin_audit_logs (admin_id, action, resource, resource_id, ip_address)
         VALUES (?, 'REVIEW_DELETE', 'product_reviews', ?, ?)`,
        [adminInfo.id, String(review.id), req.ip]
    );

    return { success: true, message: 'Review deleted.' };
}));


/**
 * GET /admin/reviews/product-summary
 * Aggregated review stats per product (for dashboard/list view).
 */
exports.adminProductReviewSummary = api({
    query: {
        limit: { type: 'int', default: 20 },
        offset: { type: 'int', default: 0 }
    }
}, auth(async (req, connection, adminInfo) => {
    if (!adminInfo.roles.some(r => REVIEW_ADMIN_ROLES.includes(r))) throw new errors.UNAUTHORIZED();

    const limit = Math.min(Math.max(req.typed.query.limit, 1), 50);
    const offset = Math.max(req.typed.query.offset, 0);

    const summaries = await connection.query(
        `SELECT p.id, p.name, p.slug, p.avg_rating, p.review_count,
                COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) as thumbnail
         FROM products p
         WHERE p.review_count > 0
         ORDER BY p.review_count DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return { success: true, summaries };
}));
