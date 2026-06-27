const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { createTrialvoPayBill } = require('../config/trialvo_pay');

// POST /api/orders — public, create order + initiate Trialvo Pay payment
async function createOrder(req, res, next) {
  try {
    const id = uuidv4();
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const {
      productId, customerName, customerEmail, customerPhone,
      company, needsHosting, notes, paymentMethod, totalBdt,
      discountAmount, shippingAddress, productName,
    } = req.body;

    // ── 1. Save order to PostgreSQL ──────────────────────────────────
    await pool.query(
      `INSERT INTO orders (id, order_id, product_id, customer_name, customer_email, customer_phone, company, needs_hosting, notes, payment_method, total_bdt, status, discount_amount, shipping_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id, orderId, productId || null, customerName, customerEmail,
        customerPhone, company || '', needsHosting ? 1 : 0,
        notes || '', paymentMethod || 'trialvo_pay', totalBdt || 0, 'pending',
        discountAmount || 0, shippingAddress ? JSON.stringify(shippingAddress) : null,
      ]
    );

    // Insert initial timeline entry
    await pool.query(
      `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES ($1, $2, NULL, 'pending', 'system', 'Order created')`,
      [uuidv4(), id]
    );

    // ── 2. Create Trialvo Pay bill & get payment URL ───────────────────────
    let pay_url = null;
    let bill_token = null;

    try {
      const billResult = await createTrialvoPayBill({
        orderId,
        productId,
        productName: productName || 'Digital Product',
        amount: totalBdt || 0,
        customerName,
        customerEmail,
        customerPhone,
        notes,
      });

      pay_url = billResult.pay_url;
      bill_token = billResult.bill_token;

      // Store the payment URL and bill token
      await pool.query(
        'UPDATE orders SET pay_url = $1, trialvo_pay_bill_token = $2 WHERE id = $3',
        [pay_url, bill_token, id]
      ).catch(() => {}); // Ignore if columns not migrated yet

      console.log(`[Order] Trialvo Pay bill created — order: ${orderId}, token: ${bill_token}`);
    } catch (pvErr) {
      console.error(`[Order] Trialvo Pay bill creation failed: ${pvErr.message}`);
      // Return order anyway — frontend shows error
    }

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    res.status(201).json({ ...rows[0], pay_url, bill_token });
  } catch (error) {
    next(error);
  }
}

// GET /api/orders/:orderId — public
async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
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
    const { rows } = await pool.query(`
      SELECT o.*,
        json_build_object('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as products
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
    `);

    const result = rows.map((row) => ({
      ...row,
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
    const current = await pool.query('SELECT status FROM orders WHERE id = $1', [id]);
    const fromStatus = current.rows.length > 0 ? current.rows[0].status : null;

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

    // Insert timeline entry
    await pool.query(
      `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES ($1, $2, $3, $4, 'admin', $5)`,
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
    let paramIdx = 1;

    if (tracking_number !== undefined) { fields.push(`tracking_number = $${paramIdx}`); values.push(tracking_number); paramIdx++; }
    if (discount_amount !== undefined) { fields.push(`discount_amount = $${paramIdx}`); values.push(discount_amount); paramIdx++; }
    if (shipping_address !== undefined) { fields.push(`shipping_address = $${paramIdx}`); values.push(JSON.stringify(shipping_address)); paramIdx++; }
    if (admin_note !== undefined) { fields.push(`admin_note = $${paramIdx}`); values.push(admin_note); paramIdx++; }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    await pool.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramIdx}`, values);

    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
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
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const current = await pool.query(`SELECT id, status FROM orders WHERE id IN (${placeholders})`, ids);
    const statusMap = {};
    current.rows.forEach(o => { statusMap[o.id] = o.status; });

    // Update all orders
    const updatePlaceholders = ids.map((_, i) => `$${i + 2}`).join(',');
    await pool.query(`UPDATE orders SET status = $1 WHERE id IN (${updatePlaceholders})`, [status, ...ids]);

    // Insert timeline entries for each
    for (const orderId of ids) {
      await pool.query(
        `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment) VALUES ($1, $2, $3, $4, 'admin', $5)`,
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
    const { rows } = await pool.query(
      'SELECT * FROM order_timeline WHERE order_id = $1 ORDER BY created_at DESC',
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
    const { rows } = await pool.query(
      'SELECT * FROM admin_notes WHERE order_id = $1 ORDER BY created_at DESC',
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

    await pool.query(
      'INSERT INTO admin_notes (id, order_id, note, created_by) VALUES ($1, $2, $3, $4)',
      [noteId, id, note, 'admin']
    );

    const { rows } = await pool.query('SELECT * FROM admin_notes WHERE id = $1', [noteId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/admin/orders/notes/:noteId
async function deleteOrderNote(req, res, next) {
  try {
    const { noteId } = req.params;
    await pool.query('DELETE FROM admin_notes WHERE id = $1', [noteId]);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
}

// GET /api/admin/orders/export — CSV
async function exportOrders(req, res, next) {
  try {
    const { status, from, to } = req.query;
    let query = `SELECT o.*, json_build_object('name', p.name, 'thumbnail', p.thumbnail, 'slug', p.slug) as products FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE 1=1`;
    const params = [];
    let paramIdx = 1;

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND o.status = $${paramIdx}`;
      paramIdx++;
    }
    if (from) {
      params.push(from);
      query += ` AND o.created_at >= $${paramIdx}`;
      paramIdx++;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      query += ` AND o.created_at <= $${paramIdx}`;
      paramIdx++;
    }
    query += ' ORDER BY o.created_at DESC';

    const { rows } = await pool.query(query, params);

    // Build CSV
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Product', 'Amount (BDT)', 'Discount', 'Status', 'Payment Method', 'Tracking', 'Date'];
    const csvRows = rows.map((r) => {
      const product = r.products || {};
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
    const ordersResult = await pool.query('SELECT status, total_bdt, created_at FROM orders');
    const orders = ordersResult.rows;

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

    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const messagesResult = await pool.query('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0');

    res.json({
      total, pending, confirmed, completed, cancelled, revenue,
      totalProducts: parseInt(productsResult.rows[0].count, 10),
      unreadMessages: parseInt(messagesResult.rows[0].count, 10),
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
