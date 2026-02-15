const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/products — public, active products with optional category filter
async function getProducts(req, res, next) {
 try {
  const { category } = req.query;
  let query = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];

  if (category) {
   query += ' AND category = ?';
   params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.execute(query, params);
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// GET /api/products/featured — public
async function getFeaturedProducts(req, res, next) {
 try {
  const [rows] = await pool.execute(
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
  const [rows] = await pool.execute('SELECT * FROM products WHERE slug = ?', [slug]);

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
  // First get the product to know its category and id
  const [product] = await pool.execute('SELECT id, category FROM products WHERE slug = ?', [slug]);
  if (product.length === 0) return res.json([]);

  const [rows] = await pool.execute(
   'SELECT * FROM products WHERE is_active = 1 AND category = ? AND id != ? LIMIT 3',
   [product[0].category, product[0].id]
  );
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/products — all products (admin)
async function adminGetProducts(req, res, next) {
 try {
  const [rows] = await pool.execute('SELECT * FROM products ORDER BY created_at DESC');
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

  await pool.execute(
   `INSERT INTO products (id, slug, category, price_bdt, price_usd, thumbnail, images, video_url, demo, name, short_description, features, facilities, faq, seo, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
   [
    id, slug, category || 'ecommerce', price_bdt || 0, price_usd || 0,
    thumbnail || '', JSON.stringify(images || {}), video_url || null,
    JSON.stringify(demo || []), JSON.stringify(name),
    JSON.stringify(short_description || {}), JSON.stringify(features || {}),
    JSON.stringify(facilities || {}), JSON.stringify(faq || []),
    JSON.stringify(seo || {}), is_featured ? 1 : 0, is_active !== false ? 1 : 0,
   ]
  );

  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
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

  for (const [key, value] of Object.entries(updates)) {
   if (key === 'id') continue;
   fields.push(`${key} = ?`);
   values.push(jsonFields.includes(key) ? JSON.stringify(value) : (key === 'is_featured' || key === 'is_active' ? (value ? 1 : 0) : value));
  }

  if (fields.length === 0) {
   return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);
  await pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);

  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
  res.json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// DELETE /api/admin/products/:id
async function deleteProduct(req, res, next) {
 try {
  const { id } = req.params;
  await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  res.json({ message: 'Product deleted successfully' });
 } catch (error) {
  next(error);
 }
}

module.exports = {
 getProducts, getFeaturedProducts, getProductBySlug, getRelatedProducts,
 adminGetProducts, createProduct, updateProduct, deleteProduct,
};
