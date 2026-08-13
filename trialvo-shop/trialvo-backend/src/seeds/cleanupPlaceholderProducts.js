/**
 * Keep only the real catalog products.
 * Hard-deletes leftover demo/placeholder rows (no longer seeded).
 */
const REAL_SLUGS = [
  'lifestyle-ecommerce',
  'fashion-ecommerce',
  'tech-shop-ecommerce',
  'combo-basket-ecommerce',
];

module.exports = {
  table: 'products',
  alwaysRun: true,
  async run(client) {
    const placeholders = REAL_SLUGS.map((_, i) => `$${i + 1}`).join(', ');
    const { rowCount } = await client.query(
      `DELETE FROM products WHERE slug NOT IN (${placeholders})`,
      REAL_SLUGS
    );
    if (rowCount > 0) {
      console.log(
        `    🧹 Removed ${rowCount} demo/placeholder product(s); catalog = ${REAL_SLUGS.join(', ')}`
      );
    } else {
      console.log(`    🧹 Catalog already clean (${REAL_SLUGS.length} real products)`);
    }
  },
};
