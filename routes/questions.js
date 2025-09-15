const express = require('express');
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const pool = getPool();

// POST /api/questions (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { text, subject, difficulty, type, options } = req.body || {};
  if (!text || !subject || !difficulty || !type || !Array.isArray(options) || options.length === 0) {
    return res.status(400).json({ error: 'text, subject, difficulty, type, and options[] are required' });
  }

  // Validate options payload
  for (const [idx, o] of options.entries()) {
    if (!o || typeof o.label !== 'string' || !o.label.trim() || typeof o.option_text !== 'string' || !o.option_text.trim()) {
      return res.status(400).json({ error: `options[${idx}] must include non-empty label and option_text` });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO `questions` (`question_text`, `text`, `subject`, `difficulty`, `type`) VALUES (?, ?, ?, ?, ?)',
      [text, text, subject, difficulty, type]
    );
    const questionId = result.insertId;

    // Cast is_correct to numeric 0/1 for MySQL TINYINT compatibility
    const optionValues = options.map(o => [
      questionId,
      o.label.trim(),
      o.option_text.trim(),
      o.is_correct ? 1 : 0
    ]);
    const placeholders = optionValues.map(() => "(?, ?, ?, ?)").join(",");

    await conn.query(
      `INSERT INTO \`options\` (\`question_id\`, \`label\`, \`option_text\`, \`is_correct\`) VALUES ${placeholders}`,
      optionValues.flat()
    );

    await conn.commit();
    return res.status(201).json({ id: questionId });
  } catch (err) {
    await conn.rollback();
    // Improve diagnostics
    console.error('Create question error:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    // Common MySQL data errors -> 400
    const badDataCodes = new Set([
      'ER_TRUNCATED_WRONG_VALUE',
      'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD',
      'ER_BAD_NULL_ERROR',
      'ER_DATA_TOO_LONG',
      'ER_BAD_FIELD_ERROR'
    ]);
    if (err && badDataCodes.has(err.code)) {
      return res.status(400).json({ error: 'Invalid data for one or more fields', details: err.sqlMessage });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

// GET /api/questions
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty, type } = req.query || {};
    const filters = [];
    const values = [];
  if (subject) { filters.push('q.`subject` = ?'); values.push(subject); }
  if (difficulty) { filters.push('q.`difficulty` = ?'); values.push(difficulty); }
  if (type) { filters.push('q.`type` = ?'); values.push(type); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT q.id AS question_id, q.\`question_text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`,
        o.id AS option_id, o.\`label\`, o.\`option_text\`, o.\`is_correct\`
   FROM \`questions\` q
   LEFT JOIN \`options\` o ON o.\`question_id\` = q.id
         ${where}
         ORDER BY q.id, o.id`,
      values
    );

    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.question_id)) {
        map.set(r.question_id, {
          id: r.question_id,
          text: r.question_text,
          subject: r.subject,
          difficulty: r.difficulty,
          type: r.type,
          options: []
        });
      }
      if (r.option_id) {
        map.get(r.question_id).options.push({
          id: r.option_id,
          label: r.label,
          option_text: r.option_text,
          is_correct: !!r.is_correct
        });
      }
    }
    return res.json(Array.from(map.values()));
  } catch (err) {
    console.error('List questions error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/questions/:id (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { text, subject, difficulty, type } = req.body || {};
  if (!text && !subject && !difficulty && !type) {
    return res.status(400).json({ error: 'At least one field (text, subject, difficulty, type) must be provided' });
  }
  const fields = [];
  const values = [];
  if (text) { fields.push('`question_text` = ?'); values.push(text); }
  if (subject) { fields.push('`subject` = ?'); values.push(subject); }
  if (difficulty) { fields.push('`difficulty` = ?'); values.push(difficulty); }
  if (type) { fields.push('`type` = ?'); values.push(type); }
  values.push(id);

  try {
  const [result] = await pool.query(`UPDATE \`questions\` SET ${fields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Update question error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/questions/:id (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // If foreign key ON DELETE CASCADE is set, deleting in questions is enough,
    // but we also explicitly delete options for safety if cascade isn't set.
  await conn.query('DELETE FROM `options` WHERE `question_id` = ?', [id]);
  const [result] = await conn.query('DELETE FROM `questions` WHERE id = ?', [id]);
    await conn.commit();
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('Delete question error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
