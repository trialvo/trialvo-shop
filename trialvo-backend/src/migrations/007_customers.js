const name = '007_customers';

async function up(connection) {
 // Customers table
 await connection.execute(`
  CREATE TABLE IF NOT EXISTS customers (
   id VARCHAR(36) PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255) NOT NULL UNIQUE,
   phone VARCHAR(20),
   password_hash VARCHAR(255) NOT NULL,
   avatar_url TEXT,
   is_verified BOOLEAN DEFAULT FALSE,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
 `);

 // Wishlists table
 await connection.execute(`
  CREATE TABLE IF NOT EXISTS wishlists (
   id VARCHAR(36) PRIMARY KEY,
   customer_id VARCHAR(36) NOT NULL,
   product_id VARCHAR(36) NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE KEY unique_wishlist (customer_id, product_id),
   FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )
 `);

 // Add customer_id to orders (nullable — guest checkout still works)
 const [cols] = await connection.execute(
  `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'customer_id'`
 );
 if (cols.length === 0) {
  await connection.execute(`ALTER TABLE orders ADD COLUMN customer_id VARCHAR(36) DEFAULT NULL`);
  await connection.execute(`ALTER TABLE orders ADD INDEX idx_orders_customer (customer_id)`);
 }
}

module.exports = { name, up };
