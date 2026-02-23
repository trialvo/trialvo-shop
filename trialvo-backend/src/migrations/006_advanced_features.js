module.exports = {
 name: '006_advanced_features',
 async up(connection) {
  // Order timeline — tracks every status change
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_timeline (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL,
        from_status VARCHAR(50) DEFAULT NULL,
        to_status VARCHAR(50) NOT NULL,
        changed_by VARCHAR(255) DEFAULT 'admin',
        comment TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timeline_order (order_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

  // Admin notes — internal notes per order
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_notes (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL,
        note TEXT NOT NULL,
        created_by VARCHAR(255) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notes_order (order_id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

  // Add new columns to orders
  const addColumnIfNotExists = async (table, column, definition) => {
   const [cols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
   );
   if (cols.length === 0) {
    await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
   }
  };

  await addColumnIfNotExists('orders', 'discount_amount', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfNotExists('orders', 'shipping_address', 'JSON DEFAULT NULL');
  await addColumnIfNotExists('orders', 'tracking_number', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('orders', 'admin_note', 'TEXT DEFAULT NULL');

  // Add sort_order to products
  await addColumnIfNotExists('products', 'sort_order', 'INT DEFAULT 0');
 },
};
