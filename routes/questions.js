const express = require('express');
const { getPool } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

const router = express.Router();
const pool = getPool();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to parse CSV buffer into array of objects
function parseCsvBufferToJson(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString('utf8'));
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Normalize a raw row to expected fields (case-insensitive header support)
function norm(v) { return (v === undefined || v === null) ? '' : String(v).trim(); }
function getField(row, names) {
  // names: array of possible header names
  for (const n of names) {
    const key = Object.keys(row).find(k => k.toLowerCase() === n.toLowerCase());
    if (key) return row[key];
  }
  return undefined;
}

function normalizeRow(row) {
  // Expected headers: Exam, Subject, Unit, Topic, SubTopic, Difficulty, Text, A, B, C, D, CorrectAnswer
  const exam = norm(getField(row, ['Exam', 'exam']));
  const subject = norm(getField(row, ['Subject', 'subject']));
  const unit = norm(getField(row, ['Unit', 'unit']));
  const topic = norm(getField(row, ['Topic', 'topic']));
  const subtopic = norm(getField(row, ['SubTopic', 'Subtopic', 'subtopic']));
  const difficulty = norm(getField(row, ['Difficulty', 'difficulty']));
  const text = norm(getField(row, ['Text', 'Question', 'QuestionText', 'text', 'question', 'questiontext']));
  // Options: prefer canonical optionA-D if present from aliasing; fallback to single-letter keys
  const A = norm(getField(row, ['optionA', 'OptionA', 'A', 'a', 'optiona']));
  const B = norm(getField(row, ['optionB', 'OptionB', 'B', 'b', 'optionb']));
  const C = norm(getField(row, ['optionC', 'OptionC', 'C', 'c', 'optionc']));
  const D = norm(getField(row, ['optionD', 'OptionD', 'D', 'd', 'optiond']));
  let correctRaw = norm(getField(row, ['correctAnswer', 'CorrectAnswer', 'Correct', 'correctanswer', 'correct']));

  return { exam, subject, unit, topic, subtopic, difficulty, text, options: { A, B, C, D }, correctRaw };
}

function computeIsCorrect(label, correctRaw) {
  if (!correctRaw) return false;
  const val = correctRaw.toString().trim();
  const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
  const upper = val.toUpperCase();
  const normalized = map[upper] || upper; // map 1-4 to A-D, else keep A-D
  return normalized === label.toUpperCase();
}

// Normalize object keys by trimming and lowercasing
function normalizeObjectKeys(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    const nk = String(k).trim().toLowerCase();
    out[nk] = obj[k];
  }
  return out;
}

// Map common header variations to canonical keys
const HEADER_ALIASES = {
  // Question text
  'q.': 'text',
  'q': 'text',
  'question': 'text',
  'question_text': 'text',
  'question text': 'text',
  'questiontext': 'text',
  // Subject
  'subject': 'subject',
  // Exam
  'exam name': 'exam',
  // Unit / Chapter
  'chapter': 'unit',
  'unit': 'unit',
  // Topic
  'topic': 'topic',
  // Subtopic
  'sub-topic': 'subtopic',
  'sub_topic': 'subtopic',
  // Options
  'option a': 'optionA',
  'option_a': 'optionA',
  'a.': 'optionA',
  'a': 'optionA',
  'option b': 'optionB',
  'option_b': 'optionB',
  'b.': 'optionB',
  'b': 'optionB',
  'option c': 'optionC',
  'option_c': 'optionC',
  'c.': 'optionC',
  'c': 'optionC',
  'option d': 'optionD',
  'option_d': 'optionD',
  'd.': 'optionD',
  'd': 'optionD',
  // Also map condensed option keys that may appear after normalization
  'optiona': 'optionA',
  'optionb': 'optionB',
  'optionc': 'optionC',
  'optiond': 'optionD',
  // Correct answer
  'correct': 'correctAnswer',
  'correct_answer': 'correctAnswer',
  'right_answer': 'correctAnswer',
  'answer': 'correctAnswer',
  'ans': 'correctAnswer',
  'ans.': 'correctAnswer',
  'correctanswer': 'correctAnswer',
  // Difficulty variations
  'difficulty level': 'difficulty',
};

// Parse paragraph-style exam blocks from a list of lines
function parseParagraphBlocksFromLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];
  const blocks = [];
  const isOptionStart = (l) => /^\s*[ABCD]\./i.test(l);
  const trimLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const extractMetaSegments = (line) => {
    // Split on common inline separators and trim
    return line.split(/\s*[/|;]\s*/).map(trimLine).filter(Boolean);
  };
  const applyMetaFromSegment = (seg, meta) => {
    let m;
    if (!meta.exam && (m = seg.match(/^EXAM\s*[:.-]\s*(.+)$/i))) meta.exam = trimLine(m[1]);
    else if (!meta.subject && (m = seg.match(/^SUBJECT\s*[:.-]\s*(.+)$/i))) meta.subject = trimLine(m[1]);
    else if (!meta.unit && (m = seg.match(/^UNIT\s*[:.-]\s*(.+)$/i))) meta.unit = trimLine(m[1]);
    else if (!meta.topic && (m = seg.match(/^TOPIC\s*[:.-]\s*(.+)$/i))) meta.topic = trimLine(m[1]);
    else if (!meta.subtopic && (m = seg.match(/^SUB[- ]?TOPIC\s*[:.-]\s*(.+)$/i))) meta.subtopic = trimLine(m[1]);
    else if (!meta.difficulty && (m = seg.match(/^DIFFICULTY(?:\s*LEVEL)?\s*[:.-]\s*(.+)$/i))) meta.difficulty = trimLine(m[1]);
  };
  const extractQuestionFromLine = (line) => {
    const m = line.match(/Q\.?\s*(.*?)(?=(?:\s+[ABCD]\.\s|\s*Ans\.|$))/i);
    return m ? trimLine(m[1]) : '';
  };
  const extractOptionsFromLine = (line) => {
    const out = {};
    // Require the option letter to be followed by a dot to avoid matching letters inside words
    // Capture until next option letter with dot, or Ans., or end
    const re = /(?:^|\s)([ABCD])\.\s*([^]*?)(?=(?:\s+[ABCD]\.\s|\s*Ans\.|$))/gi;
    let mm;
    while ((mm = re.exec(line)) !== null) {
      const label = (mm[1] || '').toUpperCase();
      const text = trimLine(mm[2] || '');
      if (text) out[label] = text;
    }
    return out; // keys A/B/C/D if found
  };
  const extractAnswerFromLine = (line) => {
    const m = line.match(/Ans\.?\s*[:.-]?\s*([A-D1-4])/i);
    return m ? m[1].toUpperCase() : '';
  };

  let i = 0;
  while (i < lines.length) {
    let exam = '', subject = '', unit = '', topic = '', subtopic = '', difficulty = '';
    // Collect metadata tokens until we hit a question token or end
    while (i < lines.length) {
      const raw = lines[i];
      const line = trimLine(raw);
      if (!line) { i++; continue; }
      if (/^\s*Q\./i.test(line)) break;
      // Extract meta from segments within this line
      const meta = { exam, subject, unit, topic, subtopic, difficulty };
      for (const seg of extractMetaSegments(line)) {
        applyMetaFromSegment(seg, meta);
      }
      ({ exam, subject, unit, topic, subtopic, difficulty } = meta);
      i++;
      if (i < lines.length && /^\s*Q\./i.test(trimLine(lines[i]))) break;
    }
    if (i >= lines.length) break;

    // Question line
    let questionText = '';
    if (/^\s*Q\./i.test(trimLine(lines[i]))) {
      const qline = trimLine(lines[i]);
      questionText = extractQuestionFromLine(qline);
      // Also try to extract inline options/answer present on the same line
      const inlineOptions = extractOptionsFromLine(qline);
      var optionA = inlineOptions['A'] || '';
      var optionB = inlineOptions['B'] || '';
      var optionC = inlineOptions['C'] || '';
      var optionD = inlineOptions['D'] || '';
      var answer = extractAnswerFromLine(qline) || '';
      i++;
    }
    // Options A-D and answer in subsequent lines (may include multiple options per line)
    optionA = optionA || ''; optionB = optionB || ''; optionC = optionC || ''; optionD = optionD || '';
    answer = answer || '';
    while (i < lines.length) {
      const line = trimLine(lines[i]);
      if (!line) { i++; continue; }
      // If next question or new meta starts, stop gathering for this block
      if (/^\s*Q\./i.test(line)) break;
      if (/EXAM\s*[:.-]|SUBJECT\s*[:.-]|UNIT\s*[:.-]|TOPIC\s*[:.-]|SUB[- ]?TOPIC\s*[:.-]|DIFFICULTY/i.test(line)) break;
  // Extract any options present in this line (must be letter followed by a dot)
  const opts = extractOptionsFromLine(line);
      if (!optionA && opts['A']) optionA = opts['A'];
      if (!optionB && opts['B']) optionB = opts['B'];
      if (!optionC && opts['C']) optionC = opts['C'];
      if (!optionD && opts['D']) optionD = opts['D'];
      if (!answer) answer = extractAnswerFromLine(line) || '';
      // If line contained neither options nor answer, and we have question text, treat as continuation of question
      if (!Object.keys(opts).length && !extractAnswerFromLine(line) && questionText) {
        questionText = (questionText + ' ' + line).trim();
      }
      // If we hit another metadata or a new question, stop this block
      i++;
    }
    // Construct block if we at least have question + options + answer
    const block = {
      exam, subject, unit, topic, subtopic, difficulty,
      text: questionText,
      optionA, optionB, optionC, optionD,
      correctAnswer: answer,
    };
    // Only push blocks that have at least a question and one option/answer; validation will enforce strictness later
    if (block.text || block.optionA || block.optionB || block.optionC || block.optionD) {
      blocks.push(block);
    }
    // Skip forward until we hit a blank or next question/meta to avoid infinite loops
    while (i < lines.length) {
      const peek = trimLine(lines[i]);
      if (!peek) { i++; continue; }
      if (/^\s*Q\.|EXAM\s*[:.-]|SUBJECT\s*[:.-]|UNIT\s*[:.-]|TOPIC\s*[:.-]|SUB[- ]?TOPIC\s*[:.-]|DIFFICULTY/i.test(peek)) break;
      i++;
    }
  }
  return blocks;
}

function applyHeaderAliases(obj) {
  const out = { ...obj };
  for (const alias of Object.keys(HEADER_ALIASES)) {
    const canonical = HEADER_ALIASES[alias];
    if (Object.prototype.hasOwnProperty.call(out, alias)) {
      if (!Object.prototype.hasOwnProperty.call(out, canonical) || out[canonical] === undefined || out[canonical] === '') {
        out[canonical] = out[alias];
      }
    }
  }
  return out;
}

// POST /api/questions/bulk (admin only)
router.post('/bulk', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use form field name "file".' });
    }
    const { originalname, buffer, mimetype } = req.file;
    console.log('Bulk upload received file:', { originalname, mimetype, size: buffer?.length });
    const lower = originalname.toLowerCase();
    let rows = [];
    try {
      if (lower.endsWith('.csv') || mimetype === 'text/csv' || mimetype === 'application/vnd.ms-excel') {
        rows = await parseCsvBufferToJson(buffer);
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const first = wb.SheetNames[0];
        const ws = wb.Sheets[first];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload .csv or .xlsx' });
      }
    } catch (parseErr) {
      console.error('Bulk upload parse error:', parseErr);
      return res.json({ success: false, inserted: 0, skipped: 0 });
    }

    // Try to detect and parse paragraph-style files from parsed rows
    try {
      const candidateLines = Array.isArray(rows)
        ? rows
            .map(r => Object.values(r || {}).map(v => (v === undefined || v === null ? '' : String(v))).join(' '))
            .map(s => s.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
        : [];
      const containsParagraphMarkers = candidateLines.some(l => /(EXAM:|\bQ\.|Ans\.)/i.test(l));
      if (containsParagraphMarkers) {
        const paraBlocks = parseParagraphBlocksFromLines(candidateLines);
        if (paraBlocks && paraBlocks.length > 0) {
          console.log('Paragraph-style detected. Parsed blocks:', paraBlocks.length);
          rows = paraBlocks;
        }
      }
    } catch (e) {
      console.warn('Paragraph-style detection error (ignored):', e?.message || e);
    }

    // Normalize headers for each row (trim + lowercase) and apply common aliases
    rows = Array.isArray(rows) ? rows.map((r) => applyHeaderAliases(normalizeObjectKeys(r))) : [];

    // Log raw headers (after normalization/alias) and first row keys explicitly
    if (Array.isArray(rows) && rows.length > 0) {
      try {
        console.log('Object.keys(first row):', Object.keys(rows[0]));
      } catch {}
    }

    const headers = Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];
    console.log('Normalized headers:', headers);
  console.log('Normalized rows sample (first 2):', rows.slice(0, 2));
    console.log('Total parsed rows:', rows.length);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({ success: false, error: 'No rows parsed. Please check file format.' });
    }

    // Skip completely empty rows (all values empty/whitespace)
    rows = rows.filter(r => {
      return Object.values(r).some(v => {
        if (v === null || v === undefined) return false;
        const s = String(v).trim();
        return s.length > 0;
      });
    });

  let insertedCount = 0;
  let skippedCount = 0;
  let missingFieldsCount = 0;
  let invalidCorrectCount = 0;
  let dbErrorCount = 0;
    for (const rawRow of rows) {
      const r = normalizeRow(rawRow);
      // Validation for required fields (relaxed: exam/unit/topic/subtopic optional)
      const requiredMissing = !r.subject || !r.difficulty || !r.text
        || !r.options.A || !r.options.B || !r.options.C || !r.options.D || !r.correctRaw;
      if (requiredMissing) {
        skippedCount += 1;
        missingFieldsCount += 1;
        continue;
      }
      // Validate correct answer letter maps to a provided option
      const val = r.correctRaw.toString().trim();
      const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      const upper = val.toUpperCase();
      const correctLetter = map[upper] || upper; // A-D expected
      if (!['A','B','C','D'].includes(correctLetter) || !r.options[correctLetter] || r.options[correctLetter].length === 0) {
        skippedCount += 1;
        invalidCorrectCount += 1;
        continue;
      }
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        // Default type to 'mcq' for bulk
        const [qResult] = await conn.query(
          'INSERT INTO `questions` (`text`, `subject`, `difficulty`, `type`, `exam`, `unit`, `topic`, `subtopic`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [r.text, r.subject, r.difficulty, 'mcq', r.exam || null, r.unit || null, r.topic || null, r.subtopic || null]
        );
        const questionId = qResult.insertId;

        const optionTuples = [];
        const entries = [ ['A', r.options.A], ['B', r.options.B], ['C', r.options.C], ['D', r.options.D] ];
        for (const [label, option_text] of entries) {
          if (option_text && option_text.length > 0) {
            optionTuples.push([questionId, label, option_text, computeIsCorrect(label, r.correctRaw) ? 1 : 0]);
          }
        }
        if (optionTuples.length === 0) {
          // If no options present, rollback and skip
          await conn.rollback();
          conn.release();
          skippedCount += 1;
          continue;
        }
        const placeholders = optionTuples.map(() => '(?, ?, ?, ?)').join(',');
        await conn.query(
          `INSERT INTO \`options\` (\`question_id\`, \`label\`, \`option_text\`, \`is_correct\`) VALUES ${placeholders}`,
          optionTuples.flat()
        );
        await conn.commit();
        insertedCount += 1;
      } catch (err) {
        try { await conn.rollback(); } catch {}
        console.error('Bulk insert row error:', err);
        skippedCount += 1;
        dbErrorCount += 1;
      } finally {
        try { conn.release(); } catch {}
      }
    }

    return res.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      reasons: {
        missingFields: missingFieldsCount,
        invalidCorrect: invalidCorrectCount,
        dbError: dbErrorCount
      }
    });
  } catch (err) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
    const { subject, difficulty, type, exam, unit, topic, subtopic, sub_topic } = req.query || {};
    // Pagination params
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(Math.min(parseInt(req.query.limit, 10) || 10, 100), 1); // cap limit to 100
    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    const values = [];
    if (subject) { filters.push('q.`subject` = ?'); values.push(subject); }
    if (difficulty) { filters.push('q.`difficulty` = ?'); values.push(difficulty); }
    if (type) { filters.push('q.`type` = ?'); values.push(type); }
    if (exam) { filters.push('q.`exam` = ?'); values.push(exam); }
    if (unit) { filters.push('q.`unit` = ?'); values.push(unit); }
    if (topic) { filters.push('q.`topic` = ?'); values.push(topic); }
    // Accept both subtopic and sub_topic
    const subtopicValue = subtopic || sub_topic;
    if (subtopicValue) { filters.push('q.`subtopic` = ?'); values.push(subtopicValue); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    // 1) Count total with same filters
    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM \`questions\` q ${where}`,
      values
    );
    const total = Number(countRow?.total || 0);

    if (total === 0) {
      return res.json({ questions: [], pagination: { total: 0, page, limit } });
    }

    // 2) Get paged question ids
    const [idRows] = await pool.query(
      `SELECT q.id FROM \`questions\` q ${where} ORDER BY q.id LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    const ids = idRows.map(r => r.id);
    if (!ids.length) {
      return res.json({ questions: [], pagination: { total, page, limit } });
    }

    // 3) Fetch questions + options for the selected ids
    const [rows] = await pool.query(
      `SELECT q.id AS question_id, q.\`text\`, q.\`subject\`, q.\`difficulty\`, q.\`type\`,
              q.\`exam\`, q.\`unit\`, q.\`topic\`, q.\`subtopic\`,
              o.id AS option_id, o.\`label\`, o.\`option_text\`, o.\`is_correct\`
         FROM \`questions\` q
         LEFT JOIN \`options\` o ON o.\`question_id\` = q.id
        WHERE q.id IN (${ids.map(() => '?').join(',')})
        ORDER BY q.id, o.id`,
      ids
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

    return res.json({
      questions: Array.from(map.values()),
      pagination: { total, page, limit }
    });
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
