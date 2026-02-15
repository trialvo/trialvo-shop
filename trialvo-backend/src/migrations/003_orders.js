module.exports = {
 name: '003_orders',
 async up(connection) {
  await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id CHAR(36) PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL UNIQUE,
        product_id CHAR(36) DEFAULT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        company VARCHAR(255) DEFAULT '',
        needs_hosting TINYINT(1) DEFAULT 0,
        notes TEXT DEFAULT NULL,
        payment_method VARCHAR(100) NOT NULL DEFAULT 'bkash',
        status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        total_bdt DECIMAL(12, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id),
        INDEX idx_status (status),
        INDEX idx_product_id (product_id)
      )
    `);
 },
};
