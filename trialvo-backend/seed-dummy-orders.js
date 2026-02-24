// Seed script to create dummy orders for admin@trialvo.com
// Usage: node seed-dummy-orders.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function main() {
 const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
 });

 const conn = await pool.getConnection();
 try {
  // 1) Find customer by email
  const [customers] = await conn.execute(
   `SELECT id, name, email, phone FROM customers WHERE email = ?`,
   ['admin@trialvo.com']
  );

  if (customers.length === 0) {
   console.log('❌ Customer admin@trialvo.com not found');
   process.exit(1);
  }

  const customer = customers[0];
  console.log(`✅ Found customer: ${customer.name} (${customer.id})`);

  // 2) Fetch product IDs
  const [products] = await conn.execute(`SELECT id, name, price_bdt FROM products WHERE is_active = 1 LIMIT 5`);
  console.log(`✅ Found ${products.length} products`);

  if (products.length === 0) {
   console.log('❌ No products found. Creating orders without product_id...');
  }

  // 3) Create dummy orders
  const statuses = ['completed', 'completed', 'processing', 'pending', 'confirmed', 'completed', 'cancelled'];
  const paymentMethods = ['bkash', 'nagad', 'cod', 'bkash', 'nagad', 'bkash', 'cod'];
  const cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Comilla', 'Rangpur'];
  const areas = ['Mirpur', 'Gulshan', 'GEC Circle', 'Zindabazar', 'Rajshahi Sadar', 'Sonadanga', 'Comilla Sadar'];

  const now = new Date();
  const orders = [];

  for (let i = 0; i < 7; i++) {
   const orderId = `TV-${String(1001 + i)}`;
   const id = uuidv4();
   const product = products[i % products.length] || null;
   const daysAgo = Math.floor(Math.random() * 60) + 1;
   const orderDate = new Date(now);
   orderDate.setDate(orderDate.getDate() - daysAgo);

   const priceBdt = product ? Number(product.price_bdt) : (10000 + Math.floor(Math.random() * 5000));
   const discount = Math.floor(Math.random() * 2000);
   const totalBdt = priceBdt - discount;

   const shippingAddress = JSON.stringify({
    name: customer.name,
    phone: customer.phone || '01700000000',
    city: cities[i],
    area: areas[i],
    address: `House #${Math.floor(Math.random() * 50) + 1}, Road #${Math.floor(Math.random() * 20) + 1}, ${areas[i]}, ${cities[i]}`,
   });

   // Check if order_id already exists
   const [existing] = await conn.execute(`SELECT id FROM orders WHERE order_id = ?`, [orderId]);
   if (existing.length > 0) {
    console.log(`⏭  Skipping ${orderId} (already exists)`);
    continue;
   }

   await conn.execute(
    `INSERT INTO orders (id, order_id, product_id, customer_id, customer_name, customer_email, customer_phone, payment_method, status, total_bdt, discount_amount, shipping_address, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
     id,
     orderId,
     product?.id || null,
     customer.id,
     customer.name,
     customer.email,
     customer.phone || '01700000000',
     paymentMethods[i],
     statuses[i],
     totalBdt,
     discount,
     shippingAddress,
     orderDate,
     orderDate,
    ]
   );

   orders.push({ id, orderId, status: statuses[i] });
   console.log(`✅ Created order: ${orderId} (${statuses[i]}) — ৳${totalBdt.toLocaleString()}`);

   // 4) Add timeline entries
   const timelineStatuses = ['pending'];
   if (['confirmed', 'processing', 'completed'].includes(statuses[i])) timelineStatuses.push('confirmed');
   if (['processing', 'completed'].includes(statuses[i])) timelineStatuses.push('processing');
   if (statuses[i] === 'completed') timelineStatuses.push('completed');
   if (statuses[i] === 'cancelled') timelineStatuses.push('cancelled');

   let prevStatus = null;
   for (let j = 0; j < timelineStatuses.length; j++) {
    const timelineDate = new Date(orderDate);
    timelineDate.setHours(timelineDate.getHours() + j * 12);

    await conn.execute(
     `INSERT INTO order_timeline (id, order_id, from_status, to_status, changed_by, comment, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
     [
      uuidv4(),
      id,
      prevStatus,
      timelineStatuses[j],
      'system',
      j === 0 ? 'Order placed by customer' : `Status updated to ${timelineStatuses[j]}`,
      timelineDate,
     ]
    );
    prevStatus = timelineStatuses[j];
   }
  }

  console.log(`\n🎉 Done! Created ${orders.length} dummy orders for ${customer.email}`);
 } catch (error) {
  console.error('❌ Error:', error.message);
 } finally {
  conn.release();
  await pool.end();
 }
}

main();
