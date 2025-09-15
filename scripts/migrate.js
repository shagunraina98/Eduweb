#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_PASS, DB_NAME, DB_PORT = 3306 } = process.env;
  const password = DB_PASS || DB_PASSWORD || '';
  if (!DB_NAME) {
    console.error('DB_NAME is required');
    process.exit(1);
  }
  const conn = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    user: DB_USER || 'root',
    password,
    port: Number(DB_PORT),
    multipleStatements: true
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.changeUser({ database: DB_NAME });

  const dir = path.join(__dirname, '..', 'sql');
  const files = fs
    .readdirSync(dir)
    .filter(f => f.match(/^\d+_.*\.sql$/))
    .filter(f => f !== '002_alter_questions_add_columns.sql')
    .sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    console.log('Applying', f);
    await conn.query(sql);
  }

  // Post-migration: ensure required columns exist on `questions`
  const [cols] = await conn.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',[DB_NAME, 'questions']
  );
  const have = new Set(cols.map(c => c.COLUMN_NAME));
  const alters = [];
  if (!have.has('text')) alters.push('ADD COLUMN `text` TEXT NOT NULL');
  if (!have.has('subject')) alters.push('ADD COLUMN `subject` VARCHAR(100) NOT NULL');
  if (!have.has('difficulty')) alters.push('ADD COLUMN `difficulty` VARCHAR(50) NOT NULL');
  if (!have.has('type')) alters.push('ADD COLUMN `type` VARCHAR(50) NOT NULL');
  if (alters.length) {
    const stmt = `ALTER TABLE \`questions\` ${alters.join(', ')}`;
    console.log('Altering questions:', stmt);
    await conn.query(stmt);
  }
  await conn.end();
  console.log('Migration complete');
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
