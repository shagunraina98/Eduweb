const express = require('express');
const { getPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const pool = getPool();

// GET /api/quiz/start (requires auth)
// Enhanced endpoint with filter support and filters response
// Query: exam, subject, unit, topic, subtopic, difficulty, limit (opt, default 10)
router.get('/start', authenticateToken, async (req, res) => {
  try {
    const { exam, subject, unit, topic, subtopic, difficulty } = req.query || {};
    let { limit } = req.query || {};
    let lim = parseInt(limit, 10);
    if (!Number.isFinite(lim)) lim = 10;
    lim = Math.max(1, Math.min(lim, 100)); // clamp 1..100

    // Build filters for quiz questions
    const filters = [];
    const values = [];
    if (exam) { filters.push('q.`exam` = ?'); values.push(exam); }
    if (subject) { filters.push('q.`subject` = ?'); values.push(subject); }
    if (unit) { filters.push('q.`unit` = ?'); values.push(unit); }
    if (topic) { filters.push('q.`topic` = ?'); values.push(topic); }
    if (subtopic) { filters.push('q.`subtopic` = ?'); values.push(subtopic); }
    if (difficulty) { filters.push('q.`difficulty` = ?'); values.push(difficulty); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // 1) Pick random questions with optional filters
    const [qRows] = await pool.query(
      `SELECT q.id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`, 
              q.\`exam\`, q.\`unit\`, q.\`topic\`, q.\`subtopic\`
       FROM \`questions\` q
       ${where}
       ORDER BY RAND()
       LIMIT ?`,
      [...values, lim]
    );

    if (!qRows || qRows.length === 0) {
      // Still fetch filters even if no questions match
      const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
      const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
      const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
      const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
      const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
      const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");

      return res.json({
        questions: [],
        filters: {
          exam: examRows.map(row => row.exam),
          subject: subjectRows.map(row => row.subject),
          unit: unitRows.map(row => row.unit),
          topic: topicRows.map(row => row.topic),
          subtopic: subtopicRows.map(row => row.subtopic),
          difficulty: difficultyRows.map(row => row.difficulty)
        }
      });
    }

    const ids = qRows.map(r => r.id);
    // 2) Fetch options for these questions (exclude is_correct for quiz)
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

    // 3) Fetch all unique filter values (not limited by current filters)
    const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");

    // 4) Build quiz questions response
    const questions = qRows.map(q => ({
      id: q.id,
      text: q.text,
      subject: q.subject,
      difficulty: q.difficulty,
      type: q.type,
      exam: q.exam,
      unit: q.unit,
      topic: q.topic,
      subtopic: q.subtopic,
      options: optByQ.get(q.id) || []
    }));

    // 5) Return both questions and filters
    return res.json({
      questions,
      filters: {
        exam: examRows.map(row => row.exam),
        subject: subjectRows.map(row => row.subject),
        unit: unitRows.map(row => row.unit),
        topic: topicRows.map(row => row.topic),
        subtopic: subtopicRows.map(row => row.subtopic),
        difficulty: difficultyRows.map(row => row.difficulty)
      }
    });
  } catch (err) {
    console.error('Quiz start error:', err);
    return res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// GET /api/quiz (legacy start - requires auth)
// Query: subject (opt), difficulty (opt), limit (opt, default 10)
router.get('/', authenticateToken, async (req, res) => {
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
      `SELECT q.id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`
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

// GET /api/quiz/attempts
// Requires authentication, returns user's quiz attempt history with detailed answers
router.get('/attempts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all quiz attempts for the user
    const [attemptRows] = await pool.query(
      `SELECT id, score,
              COALESCE(total_questions, total) AS total_questions,
              created_at 
       FROM quiz_attempts 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (!attemptRows || attemptRows.length === 0) {
      return res.json([]);
    }

    // Get attempt IDs for fetching answers
    const attemptIds = attemptRows.map(attempt => attempt.id);

    // Fetch all answers for these attempts with option texts
    let answerRows;
    try {
      [answerRows] = await pool.query(
        `SELECT 
           qaa.attempt_id,
           qaa.question_id,
           qaa.selected_option_id,
           qaa.correct_option_id,
           qaa.is_correct,
           selected_opt.option_text AS selected_text,
           correct_opt.option_text AS correct_text
         FROM quiz_attempt_answers qaa
         LEFT JOIN options selected_opt ON qaa.selected_option_id = selected_opt.id
         LEFT JOIN options correct_opt ON qaa.correct_option_id = correct_opt.id
         WHERE qaa.attempt_id IN (${attemptIds.map(() => '?').join(',')})
         ORDER BY qaa.attempt_id, qaa.question_id`,
        attemptIds
      );
    } catch (e) {
      if (e && e.code === 'ER_BAD_FIELD_ERROR') {
        [answerRows] = await pool.query(
          `SELECT 
             qaa.attempt_id,
             qaa.question_id,
             qaa.selected_option_id,
             qaa.correct_option_id,
             selected_opt.option_text AS selected_text,
             correct_opt.option_text AS correct_text
           FROM quiz_attempt_answers qaa
           LEFT JOIN options selected_opt ON qaa.selected_option_id = selected_opt.id
           LEFT JOIN options correct_opt ON qaa.correct_option_id = correct_opt.id
           WHERE qaa.attempt_id IN (${attemptIds.map(() => '?').join(',')})
           ORDER BY qaa.attempt_id, qaa.question_id`,
          attemptIds
        );
        answerRows = answerRows.map(r => ({ ...r, is_correct: r.selected_option_id === r.correct_option_id ? 1 : 0 }));
      } else {
        throw e;
      }
    }

    // Fetch options and question text for all involved questions
    const qIds = [...new Set(answerRows.map(a => a.question_id))];
    const optionsByQ = new Map();
    const questionTextById = new Map();
    if (qIds.length > 0) {
      const [optRows] = await pool.query(
        `SELECT id, question_id, label, option_text, is_correct 
         FROM options 
         WHERE question_id IN (${qIds.map(() => '?').join(',')})
         ORDER BY question_id, id`,
        qIds
      );
      for (const r of optRows) {
        if (!optionsByQ.has(r.question_id)) optionsByQ.set(r.question_id, []);
        optionsByQ.get(r.question_id).push({ id: r.id, label: r.label, option_text: r.option_text, is_correct: !!r.is_correct });
      }
      const [qtRows] = await pool.query(
        `SELECT id, \`text\` AS question_text FROM questions WHERE id IN (${qIds.map(() => '?').join(',')})`,
        qIds
      );
      for (const r of qtRows) {
        questionTextById.set(r.id, r.question_text);
      }
    }

    // Group answers by attempt_id and attach options + question text
    const answersByAttempt = new Map();
    for (const answer of answerRows) {
      if (!answersByAttempt.has(answer.attempt_id)) {
        answersByAttempt.set(answer.attempt_id, []);
      }
      answersByAttempt.get(answer.attempt_id).push({
        question_id: answer.question_id,
        question_text: questionTextById.get(answer.question_id) || '',
        selected_option_id: answer.selected_option_id,
        selected_text: answer.selected_text,
        correct_option_id: answer.correct_option_id,
        correct_text: answer.correct_text,
        is_correct: !!answer.is_correct,
        options: optionsByQ.get(answer.question_id) || []
      });
    }

    // Combine attempts with their answers
    const result = attemptRows.map(attempt => ({
      id: attempt.id,
      score: attempt.score,
      total_questions: attempt.total_questions,
      created_at: attempt.created_at,
      answers: answersByAttempt.get(attempt.id) || []
    }));

    res.json(result);

  } catch (err) {
    console.error('Quiz attempts fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

// POST /api/quiz/submit
// Requires authentication, processes quiz answers and calculates score
router.post('/submit', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { answers } = req.body;
    const userId = req.user.id;

    // Validate request body
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected answers array with { question_id, selected_option_id } objects.' 
      });
    }

    // Validate each answer object
    for (const answer of answers) {
      if (!answer.question_id || !answer.selected_option_id) {
        return res.status(400).json({ 
          error: 'Each answer must have question_id and selected_option_id.' 
        });
      }
      if (!Number.isInteger(answer.question_id) || !Number.isInteger(answer.selected_option_id)) {
        return res.status(400).json({ 
          error: 'question_id and selected_option_id must be integers.' 
        });
      }
    }

    // Extract selected option IDs for database query
    const selectedOptionIds = answers.map(a => a.selected_option_id);

    // Query options table to check which options are correct and get question details
    const [optionRows] = await connection.query(
      `SELECT id, question_id, is_correct, option_text 
       FROM options 
       WHERE id IN (${selectedOptionIds.map(() => '?').join(',')})`,
      selectedOptionIds
    );

    // Create a map for quick lookup of option details
    const optionMap = new Map();
    optionRows.forEach(opt => {
      optionMap.set(opt.id, opt);
    });

    // Validate that all selected options exist
    const missingOptions = selectedOptionIds.filter(id => !optionMap.has(id));
    if (missingOptions.length > 0) {
      return res.status(400).json({ 
        error: `Invalid option IDs: ${missingOptions.join(', ')}` 
      });
    }

    // Get correct options for each question to build response details
    const questionIds = [...new Set(answers.map(a => a.question_id))];
    const [correctOptionRows] = await connection.query(
      `SELECT id, question_id, option_text 
       FROM options 
       WHERE question_id IN (${questionIds.map(() => '?').join(',')}) AND is_correct = 1`,
      questionIds
    );

    // Create map of correct options by question_id
    const correctOptionMap = new Map();
    correctOptionRows.forEach(opt => {
      correctOptionMap.set(opt.question_id, opt);
    });

    // Calculate score and build response details
    let score = 0;
    const details = [];

    for (const answer of answers) {
      const selectedOption = optionMap.get(answer.selected_option_id);
      const correctOption = correctOptionMap.get(answer.question_id);
      
      if (!correctOption) {
        return res.status(400).json({ 
          error: `No correct option found for question_id: ${answer.question_id}` 
        });
      }

      // Check if selected option is correct
      if (selectedOption.is_correct === 1) {
        score++;
      }

      details.push({
        question_id: answer.question_id,
        selected_option_id: answer.selected_option_id,
        correct_option_id: correctOption.id,
        correct_option_text: correctOption.option_text,
        is_correct: selectedOption.is_correct === 1
      });
    }

  const total = answers.length;

    // Start transaction to save attempt and answers
    await connection.beginTransaction();

    try {
      // Insert quiz attempt record with maximum compatibility:
      // 1) Try both columns (total_questions, total) to satisfy NOT NULL legacy 'total'
      // 2) If 'total' missing, try only total_questions
      // 3) If 'total_questions' missing, try legacy 'total' only
      let attemptResult;
      try {
        [attemptResult] = await connection.query(
          'INSERT INTO quiz_attempts (user_id, score, total_questions, total) VALUES (?, ?, ?, ?)',
          [userId, score, total, total]
        );
      } catch (e1) {
        if (e1 && e1.code === 'ER_BAD_FIELD_ERROR') {
          try {
            [attemptResult] = await connection.query(
              'INSERT INTO quiz_attempts (user_id, score, total_questions) VALUES (?, ?, ?)',
              [userId, score, total]
            );
          } catch (e2) {
            if (e2 && e2.code === 'ER_BAD_FIELD_ERROR') {
              [attemptResult] = await connection.query(
                'INSERT INTO quiz_attempts (user_id, score, total) VALUES (?, ?, ?)',
                [userId, score, total]
              );
            } else {
              throw e2;
            }
          }
        } else {
          throw e1;
        }
      }

      const attemptId = attemptResult.insertId;

      // Insert quiz attempt answers
      const answerInserts = answers.map(answer => {
        const correctOption = correctOptionMap.get(answer.question_id);
        const selectedOption = optionMap.get(answer.selected_option_id);
        const isCorrect = selectedOption && selectedOption.is_correct === 1 ? 1 : 0;
        return [
          attemptId,
          answer.question_id,
          answer.selected_option_id,
          correctOption.id,
          isCorrect
        ];
      });

      if (answerInserts.length > 0) {
        try {
          await connection.query(
            `INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_id, correct_option_id, is_correct) 
             VALUES ${answerInserts.map(() => '(?, ?, ?, ?, ?)').join(', ')}`,
            answerInserts.flat()
          );
        } catch (e) {
          if (e && e.code === 'ER_BAD_FIELD_ERROR') {
            await connection.query(
              `INSERT INTO quiz_attempt_answers (attempt_id, question_id, selected_option_id, correct_option_id) 
               VALUES ${answerInserts.map(() => '(?, ?, ?, ?)').join(', ')}`,
              answerInserts.map(([aId, qId, selId, corrId/*, isCorr*/]) => [aId, qId, selId, corrId]).flat()
            );
          } else {
            throw e;
          }
        }
      }

      // Commit transaction
      await connection.commit();

      // Return success response
      res.json({
        score,
        total_questions: total,
        percentage: Math.round((score / total) * 100),
        attempt_id: attemptId,
        details
      });

    } catch (txError) {
      // Rollback transaction on error
      await connection.rollback();
      throw txError;
    }

  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Failed to process quiz submission' });
  } finally {
    connection.release();
  }
});

// GET /api/quiz/attempts/:id - details for one attempt
router.get('/attempts/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const attemptId = parseInt(req.params.id, 10);
    if (!Number.isFinite(attemptId)) return res.status(400).json({ error: 'Invalid id' });

    const [attemptRows] = await pool.query(
      `SELECT id, user_id, score, COALESCE(total_questions, total) AS total_questions, created_at
       FROM quiz_attempts WHERE id = ?`,
      [attemptId]
    );
    if (!attemptRows || attemptRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const attempt = attemptRows[0];
    if (attempt.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    let answers;
    try {
      [answers] = await pool.query(
        `SELECT 
           qaa.question_id,
           q.text AS question_text,
           qaa.selected_option_id,
           qaa.correct_option_id,
           qaa.is_correct,
           so.option_text AS selected_text,
           co.option_text AS correct_text
         FROM quiz_attempt_answers qaa
         JOIN questions q ON q.id = qaa.question_id
         LEFT JOIN options so ON so.id = qaa.selected_option_id
         LEFT JOIN options co ON co.id = qaa.correct_option_id
         WHERE qaa.attempt_id = ?
         ORDER BY qaa.question_id`,
        [attemptId]
      );
    } catch (e) {
      if (e && e.code === 'ER_BAD_FIELD_ERROR') {
        [answers] = await pool.query(
          `SELECT 
             qaa.question_id,
             q.text AS question_text,
             qaa.selected_option_id,
             qaa.correct_option_id,
             so.option_text AS selected_text,
             co.option_text AS correct_text
           FROM quiz_attempt_answers qaa
           JOIN questions q ON q.id = qaa.question_id
           LEFT JOIN options so ON so.id = qaa.selected_option_id
           LEFT JOIN options co ON co.id = qaa.correct_option_id
           WHERE qaa.attempt_id = ?
           ORDER BY qaa.question_id`,
          [attemptId]
        );
        answers = answers.map(r => ({ ...r, is_correct: r.selected_option_id === r.correct_option_id ? 1 : 0 }));
      } else {
        throw e;
      }
    }

    // Fetch all options for these questions
    const qIds = [...new Set(answers.map(a => a.question_id))];
    const optionsByQ = new Map();
    if (qIds.length > 0) {
      const [optRows] = await pool.query(
        `SELECT id, question_id, label, option_text 
         FROM options 
         WHERE question_id IN (${qIds.map(() => '?').join(',')})
         ORDER BY question_id, id`,
        qIds
      );
      for (const r of optRows) {
        if (!optionsByQ.has(r.question_id)) optionsByQ.set(r.question_id, []);
        optionsByQ.get(r.question_id).push({ id: r.id, label: r.label, option_text: r.option_text });
      }
    }

    return res.json({
      id: attempt.id,
      score: attempt.score,
      total_questions: attempt.total_questions,
      created_at: attempt.created_at,
      answers: answers.map(a => ({
        question_id: a.question_id,
        question_text: a.question_text,
        selected_option_id: a.selected_option_id,
        selected_text: a.selected_text,
        correct_option_id: a.correct_option_id,
        correct_text: a.correct_text,
        is_correct: !!a.is_correct,
        options: optionsByQ.get(a.question_id) || []
      }))
    });
  } catch (err) {
    console.error('Get attempt detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch attempt detail' });
  }
});

module.exports = router;
