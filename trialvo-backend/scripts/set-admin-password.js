require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../src/config/db');

const email = process.argv[2] || '5arafatshovo@gmail.com';
const password = process.argv[3] || '123456789';

(async () => {
  const hash = await bcrypt.hash(password, 12);
  const existing = await pool.query('SELECT id FROM admin_profiles WHERE email = $1', [email]);
  if (existing.rows.length) {
    await pool.query('UPDATE admin_profiles SET password_hash = $1 WHERE email = $2', [hash, email]);
    console.log(`Updated password for ${email}`);
  } else {
    await pool.query(
      'INSERT INTO admin_profiles (id, email, password_hash, full_name, avatar_url, role) VALUES ($1,$2,$3,$4,$5,$6)',
      [uuidv4(), email, hash, 'Admin', '', 'super_admin']
    );
    console.log(`Created admin ${email}`);
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
