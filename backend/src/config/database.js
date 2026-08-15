const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT)||5432,
  database: process.env.DB_NAME||'nyumba_link', user: process.env.DB_USER||'postgres',
  password: process.env.DB_PASSWORD, max:20, idleTimeoutMillis:30000,
  ssl: process.env.NODE_ENV==='production' ? { rejectUnauthorized:false } : false,
});
pool.on('error', err => console.error('PG error:', err));
async function testConnection() { const c=await pool.connect(); try { await c.query('SELECT NOW()'); } finally { c.release(); } }
async function query(text,params) { try { return await pool.query(text,params); } catch(err){ console.error('Query error:',err.message); throw err; } }
async function getClient() { return pool.connect(); }
module.exports = { pool, query, getClient, testConnection };
