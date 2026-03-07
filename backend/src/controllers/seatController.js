const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /seats/:showId ───────────────────────────────────────
const getSeatsByShow = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  const [seats] = await pool.query(
    `SELECT id, row_label, seat_num, status
     FROM seats
     WHERE show_id = ?
     ORDER BY row_label ASC, CAST(seat_num AS UNSIGNED) ASC`,
    [showId]
  );

  if (seats.length === 0) {
    return res.status(404).json({ success: false, message: 'No seats found for this show.' });
  }

  // Group by row for easier frontend rendering
  const grouped = seats.reduce((acc, seat) => {
    if (!acc[seat.row_number]) acc[seat.row_number] = [];
    acc[seat.row_number].push(seat);
    return acc;
  }, {});

  res.json({ success: true, data: grouped, flat: seats });
});

module.exports = { getSeatsByShow };
