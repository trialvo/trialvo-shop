const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/coupons/validate — public
async function validateCoupon(req, res, next) {
 try {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });

  const [rows] = await pool.execute('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code.toUpperCase()]);
  if (rows.length === 0) return res.status(404).json({ error: 'Invalid coupon code' });

  const coupon = rows[0];

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
   return res.status(400).json({ error: 'This coupon has expired' });
  }

  // Check usage limit
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
   return res.status(400).json({ error: 'This coupon has reached its usage limit' });
  }

  // Check minimum order
  if (coupon.min_order && orderTotal < Number(coupon.min_order)) {
   return res.status(400).json({ error: `Minimum order amount is ৳${coupon.min_order}` });
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percent') {
   discount = Math.round((orderTotal * Number(coupon.value)) / 100);
  } else {
   discount = Math.min(Number(coupon.value), orderTotal);
  }

  res.json({
   valid: true,
   coupon: {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
   },
   discount,
   finalTotal: orderTotal - discount,
  });
 } catch (error) {
  next(error);
 }
}

// POST /api/coupons/apply — increment usage (call after order placed)
async function applyCoupon(req, res, next) {
 try {
  const { couponId } = req.body;
  if (!couponId) return res.status(400).json({ error: 'Coupon ID required' });

  await pool.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
  res.json({ message: 'Coupon applied' });
 } catch (error) {
  next(error);
 }
}

// ─── Admin CRUD ────────────────────────────────────────────

// GET /api/admin/coupons
async function adminGetCoupons(req, res, next) {
 try {
  const [rows] = await pool.execute('SELECT * FROM coupons ORDER BY created_at DESC');
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// POST /api/admin/coupons
async function adminCreateCoupon(req, res, next) {
 try {
  const { code, type, value, min_order, max_uses, expires_at, is_active } = req.body;
  if (!code || !type || !value) {
   return res.status(400).json({ error: 'Code, type, and value are required' });
  }

  const id = uuidv4();
  await pool.execute(
   `INSERT INTO coupons (id, code, type, value, min_order, max_uses, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
   [id, code.toUpperCase(), type, value, min_order || 0, max_uses || null, expires_at || null, is_active !== false ? 1 : 0]
  );

  const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
 } catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
   return res.status(409).json({ error: 'Coupon code already exists' });
  }
  next(error);
 }
}

// PUT /api/admin/coupons/:id
async function adminUpdateCoupon(req, res, next) {
 try {
  const { code, type, value, min_order, max_uses, expires_at, is_active } = req.body;
  await pool.execute(
   `UPDATE coupons SET code = ?, type = ?, value = ?, min_order = ?, max_uses = ?, expires_at = ?, is_active = ? WHERE id = ?`,
   [code?.toUpperCase(), type, value, min_order || 0, max_uses || null, expires_at || null, is_active ? 1 : 0, req.params.id]
  );
  const [rows] = await pool.execute('SELECT * FROM coupons WHERE id = ?', [req.params.id]);
  res.json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// DELETE /api/admin/coupons/:id
async function adminDeleteCoupon(req, res, next) {
 try {
  await pool.execute('DELETE FROM coupons WHERE id = ?', [req.params.id]);
  res.json({ message: 'Coupon deleted' });
 } catch (error) {
  next(error);
 }
}

module.exports = { validateCoupon, applyCoupon, adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon };
