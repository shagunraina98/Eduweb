require('dotenv').config();
const express = require('express');
const cors = require('cors');
const questionRoutes = require("./routes/questions");



// Initialize DB (will create pool and log status on startup)
require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ping route
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Add GET /api/filters route
const { getPool } = require('./db');
const pool = getPool();

app.get('/api/filters', async (req, res) => {
  try {
    const [examRows] = await pool.query("SELECT DISTINCT `exam` FROM `questions` WHERE `exam` IS NOT NULL AND `exam` != '' ORDER BY `exam`");
    const [subjectRows] = await pool.query("SELECT DISTINCT `subject` FROM `questions` WHERE `subject` IS NOT NULL AND `subject` != '' ORDER BY `subject`");
    const [unitRows] = await pool.query("SELECT DISTINCT `unit` FROM `questions` WHERE `unit` IS NOT NULL AND `unit` != '' ORDER BY `unit`");
    const [topicRows] = await pool.query("SELECT DISTINCT `topic` FROM `questions` WHERE `topic` IS NOT NULL AND `topic` != '' ORDER BY `topic`");
    const [subtopicRows] = await pool.query("SELECT DISTINCT `subtopic` FROM `questions` WHERE `subtopic` IS NOT NULL AND `subtopic` != '' ORDER BY `subtopic`");
    const [difficultyRows] = await pool.query("SELECT DISTINCT `difficulty` FROM `questions` WHERE `difficulty` IS NOT NULL AND `difficulty` != '' ORDER BY `difficulty`");
    const [typeRows] = await pool.query("SELECT DISTINCT `type` FROM `questions` WHERE `type` IS NOT NULL AND `type` != '' ORDER BY `type`");

    return res.json({
      subjects: subjectRows.map(row => row.subject),
      exams: examRows.map(row => row.exam),
      units: unitRows.map(row => row.unit),
      topics: topicRows.map(row => row.topic),
      subtopics: subtopicRows.map(row => row.subtopic),
      difficulties: difficultyRows.map(row => row.difficulty),
      types: typeRows.map(row => row.type)
    });
  } catch (err) {
    console.error('Get filters error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Routers
app.use("/api/questions", questionRoutes);
app.use('/api/quiz', require('./routes/quiz'));

app.use('/api/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/quizzes', require('./routes/quizzes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
