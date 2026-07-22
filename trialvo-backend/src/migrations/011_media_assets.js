module.exports = {
 name: '011_media_assets',
 async up(client) {
  // Tracks every uploaded asset so we can serve, reference, and later clean up
  // orphaned files. Storage is driver-agnostic: storage_key is relative to the
  // active driver (local disk path or S3/GCS object key).
  await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id CHAR(36) PRIMARY KEY,
        kind VARCHAR(30) NOT NULL,
        owner_type VARCHAR(30) DEFAULT NULL,
        owner_id CHAR(36) DEFAULT NULL,
        url VARCHAR(700) NOT NULL,
        storage_key VARCHAR(700) NOT NULL,
        mime VARCHAR(100),
        size_bytes BIGINT,
        width INT,
        height INT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_media_owner ON media_assets(owner_type, owner_id)');
 },
};
