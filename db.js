const mysql = require('mysql2/promise');
require('dotenv').config();
console.log("ENV:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  db: process.env.DB_NAME
});


// Support both DB_PASS and DB_PASSWORD to be flexible
const {
  DB_HOST = 'localhost',
  DB_USER = 'appuser',
  DB_PASS,
  DB_PASSWORD,
  DB_NAME = '',
  DB_PORT = 3306,
  DB_CONNECTION_LIMIT = 10
} = process.env;

const password = DB_PASS || DB_PASSWORD || '';

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password,
      database: DB_NAME,
      port: Number(DB_PORT),
      waitForConnections: true,
      connectionLimit: Number(DB_CONNECTION_LIMIT),
      queueLimit: 0
    });
  }
  return pool;
}

async function testConnection() {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { getPool, testConnection };


 