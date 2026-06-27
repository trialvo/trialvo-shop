module.exports = {
 name: '003_orders',
 async up(client) {
  await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id CHAR(36) PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL UNIQUE,
        product_id CHAR(36) DEFAULT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        company VARCHAR(255) DEFAULT '',
        needs_hosting SMALLINT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        payment_method VARCHAR(100) NOT NULL DEFAULT 'bkash',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled', 'payment_failed')),
        total_bdt DECIMAL(12, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id)');
 },
};
