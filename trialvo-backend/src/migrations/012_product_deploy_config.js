module.exports = {
 name: '012_product_deploy_config',
 async up(client) {
  // deploy_config holds everything the provisioner needs to spin up a trial of
  // this product (docker image tags, seed reference, default trial length, etc.).
  // is_trialable gates whether the public "Request Trial" flow is offered.
  await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS deploy_config JSONB DEFAULT NULL
    `);
  await client.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS is_trialable SMALLINT DEFAULT 0
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_is_trialable ON products(is_trialable)');
 },
};
