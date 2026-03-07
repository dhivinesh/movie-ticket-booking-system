const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /user/profile ────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, gift_card_balance, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: rows[0] });
});

// ── PUT /user/profile ────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

  await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  res.json({ success: true, message: 'Profile updated.' });
});

module.exports = { getProfile, updateProfile };
