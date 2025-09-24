const express = require('express');
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const pool = getPool();

// POST /api/questions (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { text, subject, difficulty, type, options, exam, unit, topic, subtopic } = req.body || {};
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
      'INSERT INTO `questions` (`text`, `subject`, `difficulty`, `type`, `exam`, `unit`, `topic`, `subtopic`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [text, subject, difficulty, type, exam || null, unit || null, topic || null, subtopic || null]
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

// GET /api/questions/filters - Get distinct values for filter dropdowns
router.get('/filters', async (req, res) => {
  try {
    const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");

    return res.json({
      exams: examRows.map(row => row.exam),
      subjects: subjectRows.map(row => row.subject),
      units: unitRows.map(row => row.unit),
      topics: topicRows.map(row => row.topic),
      subtopics: subtopicRows.map(row => row.subtopic),
      difficulties: difficultyRows.map(row => row.difficulty)
    });
  } catch (err) {
    console.error('Get filters error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/questions (public)
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty, type, exam, unit, topic, subtopic } = req.query || {};
    const filters = [];
    const values = [];
    if (subject) { filters.push('q.`subject` = ?'); values.push(subject); }
    if (difficulty) { filters.push('q.`difficulty` = ?'); values.push(difficulty); }
    if (type) { filters.push('q.`type` = ?'); values.push(type); }
    if (exam) { filters.push('q.`exam` = ?'); values.push(exam); }
    if (unit) { filters.push('q.`unit` = ?'); values.push(unit); }
    if (topic) { filters.push('q.`topic` = ?'); values.push(topic); }
    if (subtopic) { filters.push('q.`subtopic` = ?'); values.push(subtopic); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT q.id AS question_id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`, 
        q.\`exam\`, q.\`unit\`, q.\`topic\`, q.\`subtopic\`,
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
          text: r.text,
          subject: r.subject,
          difficulty: r.difficulty,
          type: r.type,
          exam: r.exam,
          unit: r.unit,
          topic: r.topic,
          subtopic: r.subtopic,
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
  const { text, subject, difficulty, type, options, exam, unit, topic, subtopic } = req.body || {};
  
  console.log('PUT /api/questions/:id called with ID:', id);
  console.log('Request body options:', JSON.stringify(options, null, 2));
  
  if (!text && !subject && !difficulty && !type && !options && !exam && !unit && !topic && !subtopic) {
    return res.status(400).json({ error: 'At least one field (text, subject, difficulty, type, options, exam, unit, topic, subtopic) must be provided' });
  }

  // Validate options if provided
  if (options && Array.isArray(options)) {
    for (const [idx, o] of options.entries()) {
      if (!o || typeof o.label !== 'string' || !o.label.trim() || typeof o.option_text !== 'string' || !o.option_text.trim()) {
        return res.status(400).json({ error: `options[${idx}] must include non-empty label and option_text` });
      }
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // First, verify the question exists
    const [questionCheck] = await conn.query('SELECT id FROM `questions` WHERE id = ?', [id]);
    if (questionCheck.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Question not found' });
    }

    // Update question fields if provided
    if (text || subject || difficulty || type || exam !== undefined || unit !== undefined || topic !== undefined || subtopic !== undefined) {
      const fields = [];
      const values = [];
      if (text) { fields.push('`text` = ?'); values.push(text); }
      if (subject) { fields.push('`subject` = ?'); values.push(subject); }
      if (difficulty) { fields.push('`difficulty` = ?'); values.push(difficulty); }
      if (type) { fields.push('`type` = ?'); values.push(type); }
      if (exam !== undefined) { fields.push('`exam` = ?'); values.push(exam || null); }
      if (unit !== undefined) { fields.push('`unit` = ?'); values.push(unit || null); }
      if (topic !== undefined) { fields.push('`topic` = ?'); values.push(topic || null); }
      if (subtopic !== undefined) { fields.push('`subtopic` = ?'); values.push(subtopic || null); }
      values.push(id);

      const [result] = await conn.query(`UPDATE \`questions\` SET ${fields.join(', ')} WHERE id = ?`, values);
      console.log('Question update result - affected rows:', result.affectedRows);
    }

    // Handle options update if provided
    if (options && Array.isArray(options)) {
      console.log('Processing', options.length, 'options');
      
      // Get current options for this question BEFORE any changes
      const [currentOptionsBefore] = await conn.query('SELECT id, label, option_text, is_correct FROM `options` WHERE `question_id` = ? ORDER BY id', [id]);
      console.log('Current options BEFORE update:', currentOptionsBefore);
      
      const providedOptionIds = [];
      
      // Process each option: UPDATE existing or INSERT new
      for (const option of options) {
        const isCorrect = option.is_correct ? 1 : 0;
        
        if (option.id && !isNaN(parseInt(option.id))) {
          const optionId = parseInt(option.id);
          providedOptionIds.push(optionId);
          
          console.log(`Updating option ID ${optionId}:`, {
            label: option.label.trim(),
            text: option.option_text.trim(), 
            isCorrect
          });
          
          const [updateResult] = await conn.query(
            'UPDATE `options` SET `label` = ?, `option_text` = ?, `is_correct` = ? WHERE id = ? AND `question_id` = ?',
            [option.label.trim(), option.option_text.trim(), isCorrect, optionId, parseInt(id)]
          );
          console.log(`Option ${optionId} update result - affected rows:`, updateResult.affectedRows);
          
          if (updateResult.affectedRows === 0) {
            console.warn(`Warning: Option ${optionId} was not updated - may not exist or belong to question ${id}`);
          }
        } else {
          // Insert new option
          console.log('Inserting new option:', {
            questionId: id,
            label: option.label.trim(),
            text: option.option_text.trim(),
            isCorrect
          });
          
          const [insertResult] = await conn.query(
            'INSERT INTO `options` (`question_id`, `label`, `option_text`, `is_correct`) VALUES (?, ?, ?, ?)',
            [parseInt(id), option.label.trim(), option.option_text.trim(), isCorrect]
          );
          console.log('New option insert result - insertId:', insertResult.insertId);
          providedOptionIds.push(insertResult.insertId);
        }
      }

      // Delete options that are no longer present in the request
      if (providedOptionIds.length > 0) {
        console.log('Deleting options NOT in provided IDs:', providedOptionIds);
        const [deleteResult] = await conn.query(
          `DELETE FROM \`options\` WHERE \`question_id\` = ? AND id NOT IN (${providedOptionIds.map(() => '?').join(',')})`,
          [parseInt(id), ...providedOptionIds]
        );
        console.log('Delete result - affected rows:', deleteResult.affectedRows);
      }
      
      // Get options AFTER all changes to verify the update
      const [currentOptionsAfter] = await conn.query('SELECT id, label, option_text, is_correct FROM `options` WHERE `question_id` = ? ORDER BY id', [id]);
      console.log('Current options AFTER update:', currentOptionsAfter);
    }

    await conn.commit();
    console.log('Transaction committed successfully');
    
    return res.json({ 
      ok: true,
      message: 'Question and options updated successfully'
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Update question error:', {
      message: err.message,
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
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  } finally {
    conn.release();
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
