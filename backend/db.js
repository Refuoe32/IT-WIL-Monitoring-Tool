// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host    : process.env.DB_HOST     || 'localhost',
  port    : parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'wil_monitor',
  user    : process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'Wilson6300',
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  PostgreSQL connection failed:', err.message);
  } else {
    console.log('✅  PostgreSQL connected successfully');
    release();
  }
});

module.exports = pool;