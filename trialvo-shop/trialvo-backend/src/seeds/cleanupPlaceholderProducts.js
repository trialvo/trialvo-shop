/**
 * Keep only the real catalog products visible.
 * Placeholder Unsplash samples are deactivated (not hard-deleted — may have FK refs).
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
      `UPDATE products
       SET is_active = 0, is_trialable = 0, is_featured = 0, updated_at = NOW()
       WHERE slug NOT IN (${placeholders})
         AND (is_active = 1 OR is_trialable = 1 OR is_featured = 1)`,
      REAL_SLUGS
    );
    if (rowCount > 0) {
      console.log(`    🧹 Deactivated ${rowCount} placeholder product(s); active catalog = ${REAL_SLUGS.join(', ')}`);
    } else {
      console.log(`    🧹 Catalog already clean (${REAL_SLUGS.length} real products)`);
    }
  },
};
