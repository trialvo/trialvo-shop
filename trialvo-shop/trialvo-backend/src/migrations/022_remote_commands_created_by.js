/**
 * Migration 022: remote_commands.created_by is VARCHAR(64).
 * Fresh MySQL installs already create it as VARCHAR in 015 — this is a no-op
 * that only alters leftover INT columns from older Postgres→MySQL transplants.
 */
module.exports = {
  name: '022_remote_commands_created_by',
  async up(client) {
    const { rows } = await client.query(
      `SELECT DATA_TYPE AS data_type
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'remote_commands'
         AND COLUMN_NAME = 'created_by'`
    );
    const type = (rows[0]?.data_type || '').toLowerCase();
    if (type === 'int' || type === 'integer') {
      await client.query(
        'ALTER TABLE remote_commands MODIFY COLUMN created_by VARCHAR(64) DEFAULT NULL'
      );
      console.log('✅ Migration 022: remote_commands.created_by → VARCHAR');
    } else {
      console.log('✅ Migration 022: created_by already VARCHAR — skip');
    }
  },
};
