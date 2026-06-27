module.exports = {
 name: '006_advanced_features',
 async up(client) {
  // Order timeline — tracks every status change
  await client.query(`
      CREATE TABLE IF NOT EXISTS order_timeline (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        from_status VARCHAR(50) DEFAULT NULL,
        to_status VARCHAR(50) NOT NULL,
        changed_by VARCHAR(255) DEFAULT 'admin',
        comment TEXT DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id)');

  // Admin notes — internal notes per order
  await client.query(`
      CREATE TABLE IF NOT EXISTS admin_notes (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        created_by VARCHAR(255) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_notes_order ON admin_notes(order_id)');

  // Add new columns to orders (PostgreSQL ADD COLUMN IF NOT EXISTS)
  const addColumnIfNotExists = async (table, column, definition) => {
   await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table}' AND column_name='${column}') THEN
        ALTER TABLE ${table} ADD COLUMN ${column} ${definition};
      END IF;
    END $$;
   `);
  };

  await addColumnIfNotExists('orders', 'discount_amount', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfNotExists('orders', 'shipping_address', 'JSONB DEFAULT NULL');
  await addColumnIfNotExists('orders', 'tracking_number', 'VARCHAR(255) DEFAULT NULL');
  await addColumnIfNotExists('orders', 'admin_note', 'TEXT DEFAULT NULL');

  // Add sort_order to products
  await addColumnIfNotExists('products', 'sort_order', 'INT DEFAULT 0');
 },
};
