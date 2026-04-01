const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── POST /giftcard/create  (admin only) ──────────────────────
const createGiftCard = asyncHandler(async (req, res) => {
  const { code, value, expires_at } = req.body;
  if (!code || !value) {
    return res.status(400).json({ success: false, message: 'Code and value are required.' });
  }

  const [existing] = await pool.query('SELECT id FROM gift_cards WHERE code = ?', [code]);
  if (existing.length > 0) {
    return res.status(409).json({ success: false, message: 'Gift card code already exists.' });
  }

  await pool.query(
    'INSERT INTO gift_cards (code, value, is_active, created_by, expires_at) VALUES (?, ?, 1, ?, ?)',
    [code.toUpperCase(), parseFloat(value), req.user.id, expires_at || null]
  );

  res.status(201).json({ success: true, message: 'Gift card created successfully.' });
});

// ── POST /giftcard/redeem ────────────────────────────────────
const redeemGiftCard = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Code is required.' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [cards] = await conn.query(
      'SELECT * FROM gift_cards WHERE code = ? AND is_active = 1 FOR UPDATE',
      [code.toUpperCase()]
    );

    if (cards.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Invalid, deactivated, or already redeemed gift card.' });
    }

    const card = cards[0];

    // Check expiry
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      await conn.rollback();
      return res.status(410).json({ success: false, message: 'This gift card has expired.' });
    }

    if (card.redeemed_by) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Gift card already redeemed.' });
    }

    // Add value to user balance
    await conn.query(
      'UPDATE users SET gift_card_balance = gift_card_balance + ? WHERE id = ?',
      [card.value, req.user.id]
    );

    // Mark card as redeemed
    await conn.query(
      'UPDATE gift_cards SET redeemed_by = ?, redeemed_at = NOW(), is_active = 0 WHERE id = ?',
      [req.user.id, card.id]
    );

    await conn.commit();
    res.json({ success: true, message: `₹${card.value} added to your gift card balance.`, value: card.value });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ── GET /admin/giftcards ─────────────────────────────────────
const getAllGiftCards = asyncHandler(async (req, res) => {
  const [cards] = await pool.query(
    `SELECT gc.*, 
            u1.name AS created_by_name,
            u2.name AS redeemed_by_name
     FROM gift_cards gc
     LEFT JOIN users u1 ON gc.created_by  = u1.id
     LEFT JOIN users u2 ON gc.redeemed_by = u2.id
     ORDER BY gc.created_at DESC`
  );
  res.json({ success: true, data: cards });
});

// ── PUT /admin/giftcards/:id/toggle ──────────────────────────
const toggleGiftCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE gift_cards SET is_active = NOT is_active WHERE id = ?', [id]);
  res.json({ success: true, message: 'Gift card status toggled.' });
});

module.exports = { createGiftCard, redeemGiftCard, getAllGiftCards, toggleGiftCard };
