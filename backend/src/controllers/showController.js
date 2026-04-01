const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /shows/:movieId ──────────────────────────────────────
// Returns all upcoming shows for a movie, grouped by date
const getShowsByMovie = asyncHandler(async (req, res) => {
  const { movieId } = req.params;
  const { date } = req.query; // optional filter: YYYY-MM-DD

  let sql = `
    SELECT
      s.id          AS show_id,
      s.start_time,
      s.price,
      sc.screen_name,
      sc.total_seats,
      t.id          AS theater_id,
      t.name        AS theater_name,
      t.location    AS theater_location,
      (SELECT COUNT(*) FROM seats st WHERE st.show_id = s.id AND st.status = 'available') AS available_seats
    FROM shows s
    JOIN screens sc ON s.screen_id = sc.id
    JOIN theaters t  ON sc.theater_id = t.id
    WHERE s.movie_id = ?
      AND s.start_time > NOW()
      AND s.status = 'scheduled'
  `;
  const params = [movieId];

  if (date) {
    sql += ' AND DATE(s.start_time) = ?';
    params.push(date);
  }

  sql += ' ORDER BY s.start_time ASC';

  const [shows] = await pool.query(sql, params);
  res.json({ success: true, data: shows });
});

// ── GET /shows/screen/:screenId  (owner: shows for a screen) ─
const getShowsByScreen = asyncHandler(async (req, res) => {
  const { screenId } = req.params;

  const [shows] = await pool.query(
    `SELECT s.*, m.title AS movie_title, m.poster_url
     FROM shows s
     JOIN movies m ON s.movie_id = m.id
     JOIN screens sc ON s.screen_id = sc.id
     JOIN theaters t ON sc.theater_id = t.id
     WHERE s.screen_id = ? AND s.status = 'scheduled' AND t.owner_id = ?
     ORDER BY s.start_time DESC`,
    [screenId, req.user.id]
  );
  res.json({ success: true, data: shows });
});

// ── POST /owner/shows ────────────────────────────────────────
const createShow = asyncHandler(async (req, res) => {
  const { movie_id, screen_id, start_time, price, total_seats } = req.body;

  if (!movie_id || !screen_id || !start_time || !price) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (new Date(start_time) < new Date()) {
    return res.status(400).json({ success: false, message: 'Cannot schedule a show in the past.' });
  }

  // Verify screen belongs to this owner
  const [screens] = await pool.query(
    `SELECT sc.id FROM screens sc
     JOIN theaters t ON sc.theater_id = t.id
     WHERE sc.id = ? AND t.owner_id = ?`,
    [screen_id, req.user.id]
  );
  if (screens.length === 0) {
    return res.status(403).json({ success: false, message: 'Screen not found or unauthorized.' });
  }

  // Get total_seats for this screen
  const [[screen]] = await pool.query('SELECT total_seats FROM screens WHERE id = ?', [screen_id]);
  if (!screen) {
    return res.status(404).json({ success: false, message: 'Screen not found.' });
  }

  // Get duration for this movie
  const [[movie]] = await pool.query('SELECT duration FROM movies WHERE id = ?', [movie_id]);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  const requestedDuration = movie.duration + 30; // 30 min cleaning buffer

  // Check for overlapping shows on the same screen
  const [overlaps] = await pool.query(
    `SELECT s.id 
     FROM shows s
     JOIN movies m ON s.movie_id = m.id
     WHERE s.screen_id = ? 
       AND s.status != 'cancelled'
       AND s.start_time < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(s.start_time, INTERVAL (m.duration + 30) MINUTE) > ?`,
    [screen_id, start_time, requestedDuration, start_time]
  );

  if (overlaps.length > 0) {
    return res.status(409).json({ success: false, message: 'Show time overlaps with an existing show on this screen.' });
  }

  const finalTotalSeats = total_seats ? parseInt(total_seats) : screen.total_seats;
  if (finalTotalSeats <= 0 || finalTotalSeats > 1000) {
    return res.status(400).json({ success: false, message: 'Invalid seat capacity (must be between 1 and 1000).' });
  }

  const [result] = await pool.query(
    'INSERT INTO shows (movie_id, screen_id, start_time, price, total_seats) VALUES (?, ?, ?, ?, ?)',
    [movie_id, screen_id, start_time, price, total_seats ? parseInt(total_seats) : null]
  );

  const showId = result.insertId;

  // Auto-generate seats for this show dynamically matching finalTotalSeats
  const getRowLabel = (index) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  const maxSeatsPerRow = 15; // standard cap per row
  const numRows = Math.ceil(finalTotalSeats / maxSeatsPerRow);

  const seatInserts = [];
  let generated = 0;

  for (let r = 0; r < numRows; r++) {
    const row = getRowLabel(r);
    let tier = 'Standard';
    let multiplier = 1.00;

    // Simple tier logic based on row letter (first char for multi-letter rows)
    const firstChar = row[0];
    if (['A', 'B', 'C'].includes(firstChar)) {
      tier = 'VIP';
      multiplier = 1.50;
    } else if (['D', 'E', 'F', 'G'].includes(firstChar)) {
      tier = 'Gold';
      multiplier = 1.20;
    }

    for (let sn = 1; sn <= maxSeatsPerRow && generated < finalTotalSeats; sn++) {
      seatInserts.push([showId, row, sn, 'available', tier, multiplier]);
      generated++;
    }
  }

  if (seatInserts.length > 0) {
    await pool.query(
      'INSERT INTO seats (show_id, row_label, seat_num, status, tier, price_multiplier) VALUES ?',
      [seatInserts]
    );
  }

  res.status(201).json({ success: true, message: 'Show created with seats.', id: showId });
});

// ── DELETE /owner/shows/:id (Cancel Show) ────────────────────
const cancelShow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Verify ownership and timing
    const [[show]] = await conn.query(
      `SELECT s.* FROM shows s
       JOIN screens sc ON s.screen_id = sc.id
       JOIN theaters t ON sc.theater_id = t.id
       WHERE s.id = ? AND t.owner_id = ?`,
      [id, req.user.id]
    );

    if (!show) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Show not found or unauthorized.' });
    }

    if (new Date(show.start_time) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cannot cancel a show that has already started or finished.' });
    }

    // 2. Find all confirmed gift card bookings for this show
    const [bookings] = await conn.query(
      "SELECT id, user_id, total_price FROM bookings WHERE show_id = ? AND payment_method = 'gift_card' AND status = 'confirmed'",
      [id]
    );

    // 3. Refund each user
    for (const booking of bookings) {
      await conn.query(
        'UPDATE users SET gift_card_balance = gift_card_balance + ? WHERE id = ?',
        [booking.total_price, booking.user_id]
      );
    }

    // 4. Update show status
    await conn.query('UPDATE shows SET status = ? WHERE id = ?', ['cancelled', id]);

    // 5. Mark all bookings as refunded
    await conn.query('UPDATE bookings SET status = ? WHERE show_id = ?', ['refunded', id]);

    // 6. Free the seats or mark as unavailable
    await conn.query('UPDATE seats SET status = ? WHERE show_id = ?', ['unavailable', id]);

    await conn.commit();
    res.json({ success: true, message: 'Show cancelled and all gift card payments have been refunded.' });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = { getShowsByMovie, getShowsByScreen, createShow, cancelShow };
