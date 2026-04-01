const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /seats/:showId ───────────────────────────────────────
const getSeatsByShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  const [seats] = await pool.query(
    `SELECT st.id, st.row_label, st.seat_num, st.status, st.tier, st.price_multiplier, s.price AS base_price
     FROM seats st
     JOIN shows s ON st.show_id = s.id
     WHERE st.show_id = ?
     ORDER BY st.row_label ASC, CAST(st.seat_num AS UNSIGNED) ASC`,
    [showId]
  );

  if (seats.length === 0) {
    return res.status(404).json({ success: false, message: 'No seats found for this show.' });
  }

  // Group by row for easier frontend rendering
  const grouped = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = [];
    acc[seat.row_label].push(seat);
    return acc;
  }, {});

  res.json({ success: true, data: grouped, flat: seats });
});

module.exports = { getSeatsByShow };
