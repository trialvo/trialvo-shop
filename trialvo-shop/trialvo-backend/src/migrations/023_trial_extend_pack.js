/**
 * Add trial extend pack pricing + order_kind for separate extend vs product buy.
 */
async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '023_trial_extend_pack',
  async up(client) {
    await addColumnIfMissing(client, 'orders', 'order_kind', "VARCHAR(32) NOT NULL DEFAULT 'product'");
    await addColumnIfMissing(client, 'orders', 'extend_days', 'INT NULL');

    const keys = [
      ['trial_extend_days', '30', 'Days added when customer buys a trial extend pack'],
      ['trial_extend_price_bdt', '1500', 'Trial extend pack price in BDT'],
      ['trial_extend_price_usd', '15', 'Trial extend pack price in USD (display)'],
    ];
    for (const [key, value, description] of keys) {
      await client.query(
        'INSERT IGNORE INTO system_config (`key`, value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    }

    console.log('✅ Migration 023: trial extend pack settings + order_kind');
  },
};
