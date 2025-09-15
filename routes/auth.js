const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');

const router = express.Router();
const pool = getPool();

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

function getSaltRounds() {
  const sr = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
  return Number.isFinite(sr) && sr > 0 ? sr : 10;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    const saltRounds = getSaltRounds();
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
      [name, normalizedEmail, passwordHash]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, role: 'student' }, getJwtSecret());

    return res.status(201).json({ token, user: { id: userId, name, email: normalizedEmail, role: 'student' } });
  } catch (err) {
    // Duplicate email
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();

    // ✅ Hardcoded admin check
    if (
      normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase() &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign({ id: 0, role: "admin" }, getJwtSecret());
      return res.json({
        token,
        user: { id: 0, role: "admin", email: normalizedEmail }
      });
    }

    // ✅ Otherwise check in DB (students or DB-admins)
    const [rows] = await pool.query(
      "SELECT id, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    const user = rows && rows[0];
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret());
    return res.json({
      token,
      user: { id: user.id, role: user.role, email: normalizedEmail }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


module.exports = router;
