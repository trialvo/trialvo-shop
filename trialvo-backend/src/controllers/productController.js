const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper: build parameterized query with $1, $2, ... placeholders
function pgParams(startIdx, count) {
    return Array.from({ length: count }, (_, i) => `$${startIdx + i}`).join(', ');
}

// GET /api/products — public, active products with optional category filter
async function getProducts(req, res, next) {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products WHERE is_active = 1';
        const params = [];

        if (category) {
            params.push(category);
            query += ` AND category = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC';

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// GET /api/products/featured — public
async function getFeaturedProducts(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM products WHERE is_active = 1 AND is_featured = 1 ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// GET /api/products/:slug — public
async function getProductBySlug(req, res, next) {
    try {
        const { slug } = req.params;
        const { rows } = await pool.query('SELECT * FROM products WHERE slug = $1', [slug]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
}

// GET /api/products/:slug/related — public
async function getRelatedProducts(req, res, next) {
    try {
        const { slug } = req.params;
        const productResult = await pool.query('SELECT id, category FROM products WHERE slug = $1', [slug]);
        if (productResult.rows.length === 0) return res.json([]);

        const { rows } = await pool.query(
            'SELECT * FROM products WHERE is_active = 1 AND category = $1 AND id != $2 LIMIT 3',
            [productResult.rows[0].category, productResult.rows[0].id]
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/products — all products (admin)
async function adminGetProducts(req, res, next) {
    try {
        const { rows } = await pool.query('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC');
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/products
async function createProduct(req, res, next) {
    try {
        const id = uuidv4();
        const {
            slug, category, price_bdt, price_usd, thumbnail, images,
            video_url, demo, name, short_description, features, facilities,
            faq, seo, is_featured, is_active,
        } = req.body;

        await pool.query(
            `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, video_url, demo, name, short_description, features, facilities, faq, seo, is_featured, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [
                id, slug, category || 'ecommerce', price_bdt || 0, price_usd || 0,
                thumbnail || '', JSON.stringify(images || {}), video_url || null,
                JSON.stringify(demo || []), JSON.stringify(name),
                JSON.stringify(short_description || {}), JSON.stringify(features || {}),
                JSON.stringify(facilities || {}), JSON.stringify(faq || []),
                JSON.stringify(seo || {}), is_featured ? 1 : 0, is_active !== false ? 1 : 0,
            ]
        );

        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
}

// PUT /api/admin/products/:id
async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic SET clause
        const fields = [];
        const values = [];
        const jsonFields = ['images', 'demo', 'name', 'short_description', 'features', 'facilities', 'faq', 'seo'];
        let paramIdx = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (key === 'id') continue;
            fields.push(`${key} = $${paramIdx}`);
            values.push(jsonFields.includes(key) ? JSON.stringify(value) : (key === 'is_featured' || key === 'is_active' ? (value ? 1 : 0) : value));
            paramIdx++;
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIdx}`, values);

        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/admin/products/:id
async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/products/:id/duplicate
async function duplicateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });

        const product = rows[0];
        const newId = uuidv4();
        const newSlug = product.slug + '-copy-' + Date.now().toString(36);

        await pool.query(
            `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, video_url, demo, name, short_description, features, facilities, faq, seo, is_featured, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, $17)`,
            [
                newId, newSlug, product.category, product.price_bdt, product.price_usd,
                product.thumbnail, product.images, product.video_url, product.demo,
                product.name, product.short_description, product.features,
                product.facilities, product.faq, product.seo, product.is_featured,
                product.sort_order || 0,
            ]
        );

        const newResult = await pool.query('SELECT * FROM products WHERE id = $1', [newId]);
        res.status(201).json(newResult.rows[0]);
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/products/bulk
async function bulkToggleProducts(req, res, next) {
    try {
        const { ids, field, value } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No product IDs provided' });
        }
        if (!['is_active', 'is_featured'].includes(field)) {
            return res.status(400).json({ error: 'Invalid field' });
        }

        const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
        await pool.query(`UPDATE products SET ${field} = $1 WHERE id IN (${placeholders})`, [value ? 1 : 0, ...ids]);
        res.json({ message: `${ids.length} products updated` });
    } catch (error) {
        next(error);
    }
}

// PUT /api/admin/products/reorder
async function reorderProducts(req, res, next) {
    try {
        const { items } = req.body; // [{ id, sort_order }]
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items' });
        }

        for (const item of items) {
            await pool.query('UPDATE products SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
        }
        res.json({ message: 'Products reordered' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getProducts, getFeaturedProducts, getProductBySlug, getRelatedProducts,
    adminGetProducts, createProduct, updateProduct, deleteProduct,
    duplicateProduct, bulkToggleProducts, reorderProducts,
};
