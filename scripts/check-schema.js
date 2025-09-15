#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_PASS, DB_NAME, DB_PORT = 3306 } = process.env;
  const password = DB_PASS || DB_PASSWORD || '';
  
  const conn = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    user: DB_USER || 'root',
    password,
    database: DB_NAME,
    port: Number(DB_PORT)
  });

  console.log('Questions table schema:');
  const [columns] = await conn.query('DESCRIBE questions');
  console.table(columns);

  console.log('\nOptions table schema:');
  const [optionColumns] = await conn.query('DESCRIBE options');
  console.table(optionColumns);

  await conn.end();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});