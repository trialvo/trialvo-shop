const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Categories are referenced by products via the products.category (slug) column.
// Keeping that loose coupling avoids a destructive migration while still letting
// the admin panel manage the canonical category list from the database.

function isNonEmptyName(name) {
    return name && typeof name === 'object' && (name.bn || name.en);
}

// GET /api/categories — public: active categories + live product counts.
// Powers the storefront CategoriesSection so counts stay in sync with the DB.
async function getCategories(req, res, next) {
    try {
        const { rows } = await pool.query(`
            SELECT c.*, COALESCE(pc.product_count, 0) AS product_count
            FROM categories c
            LEFT JOIN (
                SELECT category, COUNT(*)::int AS product_count
                FROM products
                WHERE is_active = 1
                GROUP BY category
            ) pc ON pc.category = c.slug
            WHERE c.is_active = 1
            ORDER BY c.sort_order ASC, c.created_at ASC
        `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// GET /api/admin/categories — all categories (admin)
async function adminGetCategories(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC'
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
}

// POST /api/admin/categories
async function createCategory(req, res, next) {
    try {
        const { slug, name, description, icon, sort_order, is_active } = req.body;

        if (!slug || typeof slug !== 'string') {
            return res.status(400).json({ error: 'slug is required' });
        }
        if (!isNonEmptyName(name)) {
            return res.status(400).json({ error: 'name must include bn or en' });
        }

        const exists = await pool.query('SELECT 1 FROM categories WHERE slug = $1', [slug]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ error: 'A category with this slug already exists' });
        }

        const id = uuidv4();
        await pool.query(
            `INSERT INTO categories (id, slug, name, description, icon, sort_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id, slug, JSON.stringify(name),
                JSON.stringify(description || {}), icon || null,
                Number.isInteger(sort_order) ? sort_order : 0,
                is_active === false ? 0 : 1,
            ]
        );

        const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
}

// PUT /api/admin/categories/:id
async function updateCategory(req, res, next) {
    try {
        const { id } = req.params;
        const updates = req.body;

        const jsonFields = ['name', 'description'];
        const allowed = ['slug', 'name', 'description', 'icon', 'sort_order', 'is_active'];
        const fields = [];
        const values = [];
        let paramIdx = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (!allowed.includes(key)) continue;
            let stored = value;
            if (jsonFields.includes(key)) stored = JSON.stringify(value || {});
            else if (key === 'is_active') stored = value ? 1 : 0;
            fields.push(`${key} = $${paramIdx}`);
            values.push(stored);
            paramIdx++;
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);
        await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIdx}`, values);

        const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
}

// DELETE /api/admin/categories/:id — blocked when products still reference it,
// so we never orphan products by removing their category out from under them.
async function deleteCategory(req, res, next) {
    try {
        const { id } = req.params;
        const cat = await pool.query('SELECT slug FROM categories WHERE id = $1', [id]);
        if (cat.rows.length === 0) return res.status(404).json({ error: 'Category not found' });

        const inUse = await pool.query(
            'SELECT COUNT(*)::int AS count FROM products WHERE category = $1',
            [cat.rows[0].slug]
        );
        if (inUse.rows[0].count > 0) {
            return res.status(409).json({
                error: `Cannot delete: ${inUse.rows[0].count} product(s) still use this category`,
            });
        }

        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
}

// PUT /api/admin/categories/reorder — body: { items: [{ id, sort_order }] }
async function reorderCategories(req, res, next) {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items' });
        }
        for (const item of items) {
            await pool.query('UPDATE categories SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
        }
        res.json({ message: 'Categories reordered' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCategories,
    adminGetCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
};
