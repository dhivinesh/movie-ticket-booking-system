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
     WHERE s.screen_id = ?
     ORDER BY s.start_time DESC`,
    [screenId]
  );
  res.json({ success: true, data: shows });
});

// ── POST /owner/shows ────────────────────────────────────────
const createShow = asyncHandler(async (req, res) => {
  const { movie_id, screen_id, start_time, price } = req.body;

  if (!movie_id || !screen_id || !start_time || !price) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
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
       AND s.start_time < DATE_ADD(?, INTERVAL ? MINUTE)
       AND DATE_ADD(s.start_time, INTERVAL (m.duration + 30) MINUTE) > ?`,
    [screen_id, start_time, requestedDuration, start_time]
  );

  if (overlaps.length > 0) {
    return res.status(409).json({ success: false, message: 'Show time overlaps with an existing show on this screen.' });
  }

  const [result] = await pool.query(
    'INSERT INTO shows (movie_id, screen_id, start_time, price) VALUES (?, ?, ?, ?)',
    [movie_id, screen_id, start_time, price]
  );

  const showId = result.insertId;

  // Auto-generate seats for this show dynamically matching total_seats
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const maxSeatsPerRow = 15; // standard cap per row
  const numRows = Math.ceil(screen.total_seats / maxSeatsPerRow);
  const rowsToUse = alphabet.slice(0, numRows);
  
  const seatInserts = [];
  let generated = 0;

  for (const row of rowsToUse) {
    for (let sn = 1; sn <= maxSeatsPerRow && generated < screen.total_seats; sn++) {
      seatInserts.push([showId, row, sn, 'available']);
      generated++;
    }
  }

  if (seatInserts.length > 0) {
    await pool.query(
      'INSERT INTO seats (show_id, row_label, seat_num, status) VALUES ?',
      [seatInserts]
    );
  }

  res.status(201).json({ success: true, message: 'Show created with seats.', id: showId });
});

module.exports = { getShowsByMovie, getShowsByScreen, createShow };
