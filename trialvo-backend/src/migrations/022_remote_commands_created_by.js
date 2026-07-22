/**
 * Migration 022: remote_commands.created_by INT → VARCHAR (admin UUID).
 */
module.exports = {
  name: '022_remote_commands_created_by',
  async up(client) {
    await client.query(`
      ALTER TABLE remote_commands
      ALTER COLUMN created_by TYPE VARCHAR(64)
      USING created_by::text
    `);
    console.log('✅ Migration 022: remote_commands.created_by → VARCHAR');
  },
  async down(client) {
    await client.query(`
      ALTER TABLE remote_commands
      ALTER COLUMN created_by TYPE INT
      USING NULL
    `);
  },
};
