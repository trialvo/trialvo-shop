const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/contact — public
async function createMessage(req, res, next) {
 try {
  const id = uuidv4();
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
   return res.status(400).json({ error: 'Name, email and message are required' });
  }

  await pool.execute(
   'INSERT INTO contact_messages (id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
   [id, name, email, subject || '', message]
  );

  const [rows] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [id]);
  res.status(201).json(rows[0]);
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/messages
async function adminGetMessages(req, res, next) {
 try {
  const [rows] = await pool.execute(
   'SELECT * FROM contact_messages ORDER BY created_at DESC'
  );
  res.json(rows);
 } catch (error) {
  next(error);
 }
}

// PUT /api/admin/messages/:id/read
async function toggleRead(req, res, next) {
 try {
  const { id } = req.params;
  const { is_read } = req.body;

  await pool.execute(
   'UPDATE contact_messages SET is_read = ? WHERE id = ?',
   [is_read ? 1 : 0, id]
  );
  res.json({ message: 'Read status updated' });
 } catch (error) {
  next(error);
 }
}

// DELETE /api/admin/messages/:id
async function deleteMessage(req, res, next) {
 try {
  const { id } = req.params;
  await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);
  res.json({ message: 'Message deleted' });
 } catch (error) {
  next(error);
 }
}

// GET /api/admin/messages/unread-count
async function getUnreadCount(req, res, next) {
 try {
  const [rows] = await pool.execute(
   'SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0'
  );
  res.json({ count: rows[0].count });
 } catch (error) {
  next(error);
 }
}

module.exports = { createMessage, adminGetMessages, toggleRead, deleteMessage, getUnreadCount };
