const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/customer/wishlist
async function getWishlist(req, res, next) {
    try {
        const [rows] = await pool.execute(
            `SELECT w.*, p.name, p.slug, p.thumbnail, p.price_bdt, p.price_usd
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.customer_id = ?
       ORDER BY w.created_at DESC`,
            [req.customer.id]
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// POST /api/customer/wishlist/:productId
async function addToWishlist(req, res, next) {
    try {
        const { productId } = req.params;
        const [existing] = await pool.execute(
            'SELECT id FROM wishlists WHERE customer_id = ? AND product_id = ?',
            [req.customer.id, productId]
        );
        if (existing.length > 0) {
            return res.json({ message: 'Already in wishlist' });
        }

        const id = uuidv4();
        await pool.execute(
            'INSERT INTO wishlists (id, customer_id, product_id) VALUES (?, ?, ?)',
            [id, req.customer.id, productId]
        );
        res.status(201).json({ message: 'Added to wishlist', id });
    } catch (error) {
        next(error);
    }
}

// DELETE /api/customer/wishlist/:productId
async function removeFromWishlist(req, res, next) {
    try {
        const { productId } = req.params;
        await pool.execute(
            'DELETE FROM wishlists WHERE customer_id = ? AND product_id = ?',
            [req.customer.id, productId]
        );
        res.json({ message: 'Removed from wishlist' });
    } catch (error) {
        next(error);
    }
}

// GET /api/customer/wishlist/check/:productId
async function checkWishlist(req, res, next) {
    try {
        const [rows] = await pool.execute(
            'SELECT id FROM wishlists WHERE customer_id = ? AND product_id = ?',
            [req.customer.id, req.params.productId]
        );
        res.json({ inWishlist: rows.length > 0 });
    } catch (error) {
        next(error);
    }
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };
