/** Ignore MySQL errno 1060 (duplicate column) for idempotent ALTERs. */
async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '006_advanced_features',
  async up(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_timeline (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL,
        from_status VARCHAR(50) DEFAULT NULL,
        to_status VARCHAR(50) NOT NULL,
        changed_by VARCHAR(255) DEFAULT 'admin',
        comment TEXT DEFAULT NULL,
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_timeline_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id)');

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_notes (
        id CHAR(36) PRIMARY KEY,
        order_id CHAR(36) NOT NULL,
        note TEXT NOT NULL,
        created_by VARCHAR(255) DEFAULT 'admin',
        created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_notes_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_notes_order ON admin_notes(order_id)');

    await addColumnIfMissing(client, 'orders', 'discount_amount', 'DECIMAL(12,2) DEFAULT 0');
    await addColumnIfMissing(client, 'orders', 'shipping_address', 'JSON DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'tracking_number', 'VARCHAR(255) DEFAULT NULL');
    await addColumnIfMissing(client, 'orders', 'admin_note', 'TEXT DEFAULT NULL');
    await addColumnIfMissing(client, 'products', 'sort_order', 'INT DEFAULT 0');
  },
};
