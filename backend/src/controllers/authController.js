const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper: sign JWT
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── POST /auth/register ──────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  // Only allow customer / theater_owner self-registration
  const allowedRoles = ['customer', 'theater_owner'];
  const userRole = allowedRoles.includes(role) ? role : 'customer';

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, userRole]
  );

  const user = { id: result.insertId, email, role: userRole };
  return res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token: signToken(user),
    user: { id: result.insertId, name, email, role: userRole },
  });
});

// ── POST /auth/login ─────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active, gift_card_balance FROM users WHERE email = ?',
    [email]
  );

  if (rows.length === 0) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const user = rows[0];

  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  return res.json({
    success: true,
    message: 'Login successful.',
    token: signToken(user),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      gift_card_balance: user.gift_card_balance,
    },
  });
});

module.exports = { register, login };
