const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ route: 'quizzes', ok: true });
});

module.exports = router;
