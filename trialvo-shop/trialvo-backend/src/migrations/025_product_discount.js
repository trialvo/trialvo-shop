/** Percent off list price (price_bdt / price_usd). Checkout charges the sale amount. */
module.exports = {
  name: '025_product_discount',
  async up(client) {
    try {
      await client.query(`
        ALTER TABLE products
          ADD COLUMN discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0
          AFTER price_usd
      `);
    } catch (e) {
      if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
    }
    console.log('✅ Migration 025: products.discount_percent');
  },
};
