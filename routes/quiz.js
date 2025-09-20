const express = require('express');
const { getPool } = require('../db');

const router = express.Router();
const pool = getPool();

// GET /api/quiz
// Query: subject (opt), difficulty (opt), limit (opt, default 10)
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty } = req.query || {};
    let { limit } = req.query || {};
    let lim = parseInt(limit, 10);
    if (!Number.isFinite(lim)) lim = 10;
    lim = Math.max(1, Math.min(lim, 100)); // clamp 1..100

    // 1) Pick random questions with optional filters
    const filters = [];
    const values = [];
    if (subject) { filters.push('q.`subject` = ?'); values.push(subject); }
    if (difficulty) { filters.push('q.`difficulty` = ?'); values.push(difficulty); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const [qRows] = await pool.query(
      `SELECT q.id, q.\`question_text\` AS text, q.\`subject\`, q.\`difficulty\`, q.\`type\`
       FROM \`questions\` q
       ${where}
       ORDER BY RAND()
       LIMIT ?`,
      [...values, lim]
    );

    if (!qRows || qRows.length === 0) {
      return res.json([]);
    }

    const ids = qRows.map(r => r.id);
    // 2) Fetch options for these questions (exclude is_correct)
    const [oRows] = await pool.query(
      `SELECT o.id, o.\`question_id\`, o.\`label\`, o.\`option_text\`
       FROM \`options\` o
       WHERE o.\`question_id\` IN (${ids.map(() => '?').join(',')})
       ORDER BY o.id`,
      ids
    );

    const optByQ = new Map();
    for (const r of oRows) {
      if (!optByQ.has(r.question_id)) optByQ.set(r.question_id, []);
      optByQ.get(r.question_id).push({ id: r.id, label: r.label, option_text: r.option_text });
    }

    const result = qRows.map(q => ({
      id: q.id,
      text: q.text,
      subject: q.subject,
      difficulty: q.difficulty,
      type: q.type,
      options: optByQ.get(q.id) || []
    }));

    return res.json(result);
  } catch (err) {
    console.error('Quiz fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

module.exports = router;
