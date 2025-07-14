const { Pool } = require('pg');
const dotenv = require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected:', res.rows[0].now);
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
  }
}

testConnection();

module.exports = pool; 