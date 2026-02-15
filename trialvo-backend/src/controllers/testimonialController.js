const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/testimonials — public, active only
async function getTestimonials(req, res, next) {
 try {
  const [rows] = await pool.execute(
   'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY created_at DESC'
  );
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/testimonials — all
async function adminGetTestimonials(req, res, next) {
 try {
  const [rows] = await pool.execute(
   'SELECT * FROM testimonials ORDER BY created_at DESC'
  );
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// POST /api/admin/testimonials
async function createTestimonial(req, res, next) {
 try {
  const id = uuidv4();
  const { name, role, content, rating, avatar, is_active } = req.body;

  await pool.execute(
   `INSERT INTO testimonials (id, name, role, content, rating, avatar, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
   [
    id, JSON.stringify(name), JSON.stringify(role),
    JSON.stringify(content), rating || 5, avatar || '',
    is_active !== false ? 1 : 0,
   ]
  );

  const [rows] = await pool.execute('SELECT * FROM testimonials WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/testimonials/:id
async function updateTestimonial(req, res, next) {
 try {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];
  const jsonFields = ['name', 'role', 'content'];

  for (const [key, value] of Object.entries(updates)) {
   if (key === 'id') continue;
   fields.push(`${key} = ?`);
   values.push(jsonFields.includes(key) ? JSON.stringify(value) : (key === 'is_active' ? (value ? 1 : 0) : value));
  }

  if (fields.length === 0) {
   return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id);
  await pool.execute(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`, values);
  res.json({ message: 'Testimonial updated' });
 } catch (error) {
  next(error);
 }
}

// DELETE /api/admin/testimonials/:id
async function deleteTestimonial(req, res, next) {
 try {
  const { id } = req.params;
  await pool.execute('DELETE FROM testimonials WHERE id = ?', [id]);
  res.json({ message: 'Testimonial deleted' });
 } catch (error) {
  next(error);
 }
}

module.exports = {
 getTestimonials, adminGetTestimonials,
 createTestimonial, updateTestimonial, deleteTestimonial,
};
