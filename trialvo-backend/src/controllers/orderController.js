const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// POST /api/orders — public, create order
async function createOrder(req, res, next) {
  try {
    const id = uuidv4();
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const {
      productId, customerName, customerEmail, customerPhone,
      company, needsHosting, notes, paymentMethod, totalBdt,
      discountAmount, shippingAddress,
    } = req.body;

    const customerId = req.customer?.id || req.body.customerId || null;

    await pool.execute(
      `INSERT INTO orders (id, order_id, product_id, customer_name, customer_email, customer_phone, company, needs_hosting, notes, payment_method, total_bdt, status, discount_amount, shipping_address, customer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, orderId, productId || null, customerName, customerEmail,
        customerPhone, company || '', needsHosting ? 1 : 0,
        notes || '', paymentMethod, totalBdt || 0, 'pending',
        discountAmount || 0, shippingAddress ? JSON.stringify(shippingAddress) : null,
        customerId,
      ]
    );

    // Insert initial timeline entry
    await pool.execute(
      `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES (?, ?, NULL, 'pending', 'system', 'Order created')`,
      [uuidv4(), id]
    );

    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// GET /api/orders/:orderId — public
async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/orders — with product info
async function adminGetOrders(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT o.*, 
        JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as products
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    const result = rows.map((row) => ({
      ...row,
      products: row.products ? (typeof row.products === 'string' ? JSON.parse(row.products) : row.products) : null,
      shipping_address: row.shipping_address ? (typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address) : null,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// PUT /api/admin/orders/:id/status
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    // Get current status for timeline
    const [current] = await pool.execute('SELECT status FROM orders WHERE id = ?', [id]);
    const fromStatus = current.length > 0 ? current[0].status : null;

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Insert timeline entry
    await pool.execute(
      `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, 'admin', ?)`,
      [uuidv4(), id, fromStatus, status, comment || null]
    );

    res.json({ message: 'Order status updated' });
  } catch (error) {
    next(error);
  }
}

// PUT /api/admin/orders/:id — update order details
async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { tracking_number, discount_amount, shipping_address, admin_note } = req.body;

    const fields = [];
    const values = [];

    if (tracking_number !== undefined) { fields.push('tracking_number = ?'); values.push(tracking_number); }
    if (discount_amount !== undefined) { fields.push('discount_amount = ?'); values.push(discount_amount); }
    if (shipping_address !== undefined) { fields.push('shipping_address = ?'); values.push(JSON.stringify(shipping_address)); }
    if (admin_note !== undefined) { fields.push('admin_note = ?'); values.push(admin_note); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    await pool.execute(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/orders/bulk-status — bulk update
async function bulkUpdateStatus(req, res, next) {
  try {
    const { ids, status, comment } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No order IDs provided' });
    }

    // Get current statuses for timeline
    const placeholders = ids.map(() => '?').join(',');
    const [current] = await pool.execute(`SELECT id, status FROM orders WHERE id IN (${placeholders})`, ids);
    const statusMap = {};
    current.forEach(o => { statusMap[o.id] = o.status; });

    // Update all orders
    await pool.execute(`UPDATE orders SET status = ? WHERE id IN (${placeholders})`, [status, ...ids]);

    // Insert timeline entries for each
    for (const orderId of ids) {
      await pool.execute(
        `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES (?, ?, ?, ?, 'admin', ?)`,
        [uuidv4(), orderId, statusMap[orderId] || null, status, comment || `Bulk updated to ${status}`]
      );
    }

    res.json({ message: `${ids.length} orders updated to ${status}` });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/orders/:id/timeline
async function getOrderTimeline(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM order_timeline WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/orders/:id/notes
async function getOrderNotes(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM admin_notes WHERE order_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// POST /api/admin/orders/:id/notes
async function addOrderNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const noteId = uuidv4();

    await pool.execute(
      'INSERT INTO admin_notes (id, order_id, note, created_by) VALUES (?, ?, ?, ?)',
      [noteId, id, note, 'admin']
    );

    const [rows] = await pool.execute('SELECT * FROM admin_notes WHERE id = ?', [noteId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/orders/notes/:noteId
async function deleteOrderNote(req, res, next) {
  try {
    const { noteId } = req.params;
    await pool.execute('DELETE FROM admin_notes WHERE id = ?', [noteId]);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/orders/export — CSV
async function exportOrders(req, res, next) {
  try {
    const { status, from, to } = req.query;
    let query = `SELECT o.*, JSON_OBJECT('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as products FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (from) {
      query += ' AND o.created_at >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND o.created_at <= ?';
      params.push(to + ' 23:59:59');
    }
    query += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.execute(query, params);

    // Build CSV
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Product', 'Amount (BDT)', 'Discount', 'Status', 'Payment Method', 'Tracking', 'Date'];
    const csvRows = rows.map((r) => {
      const product = r.products ? (typeof r.products === 'string' ? JSON.parse(r.products) : r.products) : {};
      const productName = product.name ? (typeof product.name === 'string' ? JSON.parse(product.name) : product.name)?.en || '' : '';
      return [
        r.order_id,
        `"${r.customer_name}"`,
        r.customer_email,
        r.customer_phone,
        `"${productName}"`,
        r.total_bdt,
        r.discount_amount || 0,
        r.status,
        r.payment_method,
        r.tracking_number || '',
        new Date(r.created_at).toISOString().split('T')[0],
      ].join(',');
    });

    const csv = [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/dashboard — enhanced stats
async function getDashboardStats(req, res, next) {
  try {
    const [orders] = await pool.execute('SELECT status, total_bdt, created_at FROM orders');

    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const confirmed = orders.filter((o) => o.status === 'confirmed').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total_bdt || 0), 0);

    // Weekly comparison
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    const weeklyOrders = thisWeekOrders.length;
    const weeklyRevenue = thisWeekOrders.reduce((s, o) => s + Number(o.total_bdt || 0), 0);
    const prevWeekOrders = lastWeekOrders.length;
    const prevWeekRevenue = lastWeekOrders.reduce((s, o) => s + Number(o.total_bdt || 0), 0);

    // Monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= monthStart && d <= monthEnd;
      });
      monthlyData.push({
        month: monthStart.toLocaleString('en', { month: 'short' }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((s, o) => s + Number(o.total_bdt || 0), 0),
      });
    }

    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [messages] = await pool.execute('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0');

    res.json({
      total, pending, confirmed, completed, cancelled, revenue,
      totalProducts: products[0].count,
      unreadMessages: messages[0].count,
      weeklyOrders,
      weeklyRevenue,
      prevWeekOrders,
      prevWeekRevenue,
      monthlyData,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder, getOrder, adminGetOrders, updateOrderStatus, updateOrder,
  bulkUpdateStatus, getOrderTimeline, getOrderNotes, addOrderNote, deleteOrderNote,
  exportOrders, getDashboardStats,
};
