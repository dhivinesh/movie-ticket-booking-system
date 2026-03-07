const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /admin/analytics ─────────────────────────────────────
const getAnalytics = asyncHandler(async (req, res) => {
  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*)                                                  AS total_bookings,
      COALESCE(SUM(total_price), 0)                            AS total_revenue,
      (SELECT COUNT(*) FROM users WHERE role = 'customer')     AS total_customers,
      (SELECT COUNT(*) FROM movies WHERE is_active = 1)        AS total_movies
    FROM bookings WHERE status = 'confirmed'
  `);

  const [monthly] = await pool.query(`
    SELECT
      DATE_FORMAT(created_at, '%Y-%m') AS month,
      COUNT(*)                          AS bookings,
      SUM(total_price)                  AS revenue
    FROM bookings
    WHERE status = 'confirmed' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY month
    ORDER BY month ASC
  `);

  res.json({ success: true, data: { ...totals, monthly } });
});

// ── GET /admin/users ─────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [users] = await pool.query(
    `SELECT id, name, email, role, is_active, gift_card_balance, created_at
     FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(limit), offset]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  res.json({ success: true, data: users, total });
});

// ── PUT /admin/users/:id/deactivate ──────────────────────────
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE users SET is_active = 0 WHERE id = ? AND role != "admin"', [id]);
  res.json({ success: true, message: 'User deactivated.' });
});

// ── PUT /admin/users/:id/activate ────────────────────────────
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [id]);
  res.json({ success: true, message: 'User activated.' });
});

// ── GET /admin/transactions ───────────────────────────────────
const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const [transactions] = await pool.query(
    `SELECT b.id, b.total_price, b.payment_method, b.status, b.created_at,
            u.name AS customer_name, u.email,
            m.title AS movie_title
     FROM bookings b
     JOIN users u  ON b.user_id = u.id
     JOIN shows s  ON b.show_id = s.id
     JOIN movies m ON s.movie_id = m.id
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [parseInt(limit), offset]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
  res.json({ success: true, data: transactions, total });
});

module.exports = { getAnalytics, getAllUsers, deactivateUser, activateUser, getAllTransactions };
