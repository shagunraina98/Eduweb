const axios = require('axios');

async function run() {
  const base = process.env.BASE_URL || 'http://localhost:5000';
  const email = process.env.TEST_EMAIL || 'smoke@test.com';
  const password = process.env.TEST_PASSWORD || 'smokepass123';

  try {
    // Register (ignore if already registered)
    try {
      await axios.post(`${base}/api/auth/register`, { name: 'Smoke', email, password });
    } catch (_) {}

    // Login
    const login = await axios.post(`${base}/api/auth/login`, { email, password });
    const token = login.data.token;

    // Get some quiz questions
    const { data: start } = await axios.get(`${base}/api/quiz/start?limit=3`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!start.questions || start.questions.length === 0) {
      throw new Error('No questions available to attempt');
    }

    // Build fake answers: pick first option per question
    const answers = [];
    for (const q of start.questions) {
      const first = q.options && q.options[0];
      if (first) {
        answers.push({ question_id: q.id, selected_option_id: first.id });
      }
    }

    const submit = await axios.post(`${base}/api/quiz/submit`, { answers }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Submit OK:', submit.data);
    const attempts = await axios.get(`${base}/api/quiz/attempts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Attempts:', attempts.data.length);
  } catch (err) {
    console.error('Smoke failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
