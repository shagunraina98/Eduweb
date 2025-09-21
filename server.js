require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Process event handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Setting up routes...');

// Import routes
try {
  console.log('Importing auth routes...');
  const authRoutes = require('./routes/auth');
  console.log('Auth routes imported successfully');
  
  console.log('Importing quiz routes...');
  const quizRoutes = require('./routes/quiz');
  console.log('Quiz routes imported successfully');
  
  console.log('Importing question routes...');
  const questionRoutes = require('./routes/questions');
  console.log('Question routes imported successfully');
  
  console.log('Importing admin routes...');
  const adminRoutes = require('./routes/admin');
  console.log('Admin routes imported successfully');
  
  console.log('Importing quizzes routes...');
  const quizzesRoutes = require('./routes/quizzes');
  console.log('Quizzes routes imported successfully');

  // Route middleware
  app.use('/api/auth', authRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/quizzes', quizzesRoutes);
  
  console.log('Routes setup complete');
} catch (error) {
  console.error('Error setting up routes:', error);
}

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

    return res.json({
      subjects: subjectRows.map(row => row.subject),
      exams: examRows.map(row => row.exam),
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

// Basic health route
app.get('/health', (req, res) => {
  console.log('Health endpoint hit');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.send('API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Keep the process alive
console.log('Server setup complete, keeping process alive...');
