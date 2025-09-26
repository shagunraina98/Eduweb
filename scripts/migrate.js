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
    // Skip raw ALTER scripts that may duplicate columns or use unsupported syntax; we'll add missing columns idempotently below
    .filter(f => !['002_alter_questions_add_columns.sql','003_add_metadata_columns.sql','004_alter_quiz_attempts_answers.sql'].includes(f))
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
  // Optional metadata columns used by filters
  if (!have.has('exam')) alters.push('ADD COLUMN `exam` VARCHAR(100) NULL');
  if (!have.has('unit')) alters.push('ADD COLUMN `unit` VARCHAR(100) NULL');
  if (!have.has('topic')) alters.push('ADD COLUMN `topic` VARCHAR(100) NULL');
  if (!have.has('subtopic')) alters.push('ADD COLUMN `subtopic` VARCHAR(100) NULL');
  if (alters.length) {
    const stmt = `ALTER TABLE \`questions\` ${alters.join(', ')}`;
    console.log('Altering questions:', stmt);
    await conn.query(stmt);
  }

  // Ensure quiz_attempts table exists
  const [tables] = await conn.query(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?, ?)',
    [DB_NAME, 'quiz_attempts', 'quiz_attempt_answers']
  );
  const tableSet = new Set(tables.map(t => t.TABLE_NAME));
  if (!tableSet.has('quiz_attempts') || !tableSet.has('quiz_attempt_answers')) {
    const qaSql = fs.readFileSync(path.join(dir, '003_quiz_attempts.sql'), 'utf8');
    console.log('Ensuring quiz attempts tables');
    await conn.query(qaSql);
  }

  // Ensure columns on quiz_attempts and quiz_attempt_answers
  const [qaCols] = await conn.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [DB_NAME, 'quiz_attempts']
  );
  const qaHave = new Set(qaCols.map(c => c.COLUMN_NAME));
  const qaAlters = [];
  if (!qaHave.has('total') && !qaHave.has('total_questions')) {
    qaAlters.push('ADD COLUMN `total` INT NOT NULL DEFAULT 0');
  }
  if (!qaHave.has('total_questions')) {
    qaAlters.push('ADD COLUMN `total_questions` INT NOT NULL DEFAULT 0 AFTER `score`');
  }
  if (qaAlters.length) {
    const stmt = `ALTER TABLE \`quiz_attempts\` ${qaAlters.join(', ')}`;
    console.log('Altering quiz_attempts:', stmt);
    await conn.query(stmt);
  }

  const [qaaCols] = await conn.query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [DB_NAME, 'quiz_attempt_answers']
  );
  const qaaHave = new Set(qaaCols.map(c => c.COLUMN_NAME));
  const qaaAlters = [];
  if (!qaaHave.has('is_correct')) {
    qaaAlters.push('ADD COLUMN `is_correct` TINYINT(1) NOT NULL DEFAULT 0 AFTER `selected_option_id`');
  }
  if (qaaAlters.length) {
    const stmt = `ALTER TABLE \`quiz_attempt_answers\` ${qaaAlters.join(', ')}`;
    console.log('Altering quiz_attempt_answers:', stmt);
    await conn.query(stmt);
  }
  await conn.end();
  console.log('Migration complete');
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
