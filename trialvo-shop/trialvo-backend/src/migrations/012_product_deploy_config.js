async function addColumnIfMissing(client, table, column, definition) {
  try {
    await client.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  } catch (e) {
    if (e.errno !== 1060 && e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
}

module.exports = {
  name: '012_product_deploy_config',
  async up(client) {
    await addColumnIfMissing(client, 'products', 'deploy_config', 'JSON DEFAULT NULL');
    await addColumnIfMissing(client, 'products', 'is_trialable', 'SMALLINT DEFAULT 0');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_trialable ON products(is_trialable)');
  },
};
