const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /owner/theaters ──────────────────────────────────────
const getOwnerTheaters = asyncHandler(async (req, res) => {
  const [theaters] = await pool.query(
    `SELECT t.*, 
            COUNT(DISTINCT sc.id) AS screen_count
     FROM theaters t
     LEFT JOIN screens sc ON sc.theater_id = t.id
     WHERE t.owner_id = ?
     GROUP BY t.id`,
    [req.user.id]
  );
  res.json({ success: true, data: theaters });
});

// ── POST /owner/theaters ─────────────────────────────────────
const createTheater = asyncHandler(async (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) {
    return res.status(400).json({ success: false, message: 'Name and location are required.' });
  }
  const [result] = await pool.query(
    'INSERT INTO theaters (name, location, owner_id) VALUES (?, ?, ?)',
    [name, location, req.user.id]
  );
  res.status(201).json({ success: true, message: 'Theater created.', id: result.insertId });
});

// ── PUT /owner/theaters/:id ───────────────────────────────────
const updateTheater = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;

  const [theaters] = await pool.query(
    'SELECT id FROM theaters WHERE id = ? AND owner_id = ?',
    [id, req.user.id]
  );
  if (theaters.length === 0) {
    return res.status(404).json({ success: false, message: 'Theater not found or unauthorized.' });
  }

  await pool.query(
    'UPDATE theaters SET name = COALESCE(?, name), location = COALESCE(?, location) WHERE id = ?',
    [name, location, id]
  );
  res.json({ success: true, message: 'Theater updated.' });
});

// ── GET /owner/screens/:theaterId ────────────────────────────
const getScreensByTheater = asyncHandler(async (req, res) => {
  const { theaterId } = req.params;

  const [screens] = await pool.query(
    `SELECT sc.*
     FROM screens sc
     JOIN theaters t ON sc.theater_id = t.id
     WHERE sc.theater_id = ? AND t.owner_id = ?`,
    [theaterId, req.user.id]
  );
  res.json({ success: true, data: screens });
});

// ── POST /owner/screens ───────────────────────────────────────
const createScreen = asyncHandler(async (req, res) => {
  const { theater_id, screen_name, total_seats } = req.body;
  if (!theater_id || !screen_name || !total_seats) {
    return res.status(400).json({ success: false, message: 'theater_id, screen_name and total_seats are required.' });
  }

  const [theaters] = await pool.query(
    'SELECT id FROM theaters WHERE id = ? AND owner_id = ?',
    [theater_id, req.user.id]
  );
  if (theaters.length === 0) {
    return res.status(403).json({ success: false, message: 'Theater not found or unauthorized.' });
  }

  const [result] = await pool.query(
    'INSERT INTO screens (theater_id, screen_name, total_seats) VALUES (?, ?, ?)',
    [theater_id, screen_name, parseInt(total_seats)]
  );
  res.status(201).json({ success: true, message: 'Screen created.', id: result.insertId });
});

// ── GET /owner/shows ──────────────────────────────────────────
const getOwnerShows = asyncHandler(async (req, res) => {
  const [shows] = await pool.query(
    `SELECT s.id, s.start_time, s.price,
            m.title AS movie_title, m.genre,
            sc.screen_name,
            t.name  AS theater_name,
            COUNT(CASE WHEN st.status = 'available' THEN 1 END) AS available_seats,
            COUNT(CASE WHEN st.status = 'booked'    THEN 1 END) AS booked_seats,
            COUNT(st.id) AS total_seats
     FROM shows s
     JOIN movies m   ON s.movie_id  = m.id
     JOIN screens sc ON s.screen_id = sc.id
     JOIN theaters t ON sc.theater_id = t.id
     LEFT JOIN seats st ON st.show_id = s.id
     WHERE t.owner_id = ?
     GROUP BY s.id
     ORDER BY s.start_time DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: shows });
});

// ── GET /owner/occupancy/:showId ──────────────────────────────
const getOccupancy = asyncHandler(async (req, res) => {
  const { showId } = req.params;

  // Validate ownership
  const [rows] = await pool.query(
    `SELECT s.id FROM shows s
     JOIN screens sc ON s.screen_id = sc.id
     JOIN theaters t  ON sc.theater_id = t.id
     WHERE s.id = ? AND t.owner_id = ?`,
    [showId, req.user.id]
  );
  if (rows.length === 0) {
    return res.status(403).json({ success: false, message: 'Show not found or unauthorized.' });
  }

  const [seats] = await pool.query(
    `SELECT id, row_label, seat_num, status
     FROM seats WHERE show_id = ?
     ORDER BY row_label, CAST(seat_num AS UNSIGNED)`,
    [showId]
  );

  const summary = {
    total:     seats.length,
    available: seats.filter(s => s.status === 'available').length,
    reserved:  seats.filter(s => s.status === 'reserved').length,
    booked:    seats.filter(s => s.status === 'booked').length,
  };

  res.json({ success: true, seats, summary });
});

// ── GET /owner/sales ──────────────────────────────────────────
const getDailySales = asyncHandler(async (req, res) => {
  const [sales] = await pool.query(
    `SELECT
       DATE(b.created_at)  AS date,
       COUNT(b.id)         AS bookings,
       SUM(b.total_price)  AS revenue,
       m.title             AS movie_title
     FROM bookings b
     JOIN shows s  ON b.show_id  = s.id
     JOIN movies m ON s.movie_id = m.id
     JOIN screens sc ON s.screen_id = sc.id
     JOIN theaters t ON sc.theater_id = t.id
     WHERE t.owner_id = ? AND b.status = 'confirmed'
       AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(b.created_at), m.title
     ORDER BY date DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: sales });
});

// ── POST /owner/verify-ticket ─────────────────────────────────
const verifyTicket = asyncHandler(async (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) {
    return res.status(400).json({ success: false, message: 'booking_id is required.' });
  }

  const [rows] = await pool.query(
    `SELECT b.id, b.status, b.created_at,
            u.name AS customer_name,
            m.title AS movie_title,
            s.start_time,
            t.name AS theater_name,
            sc.screen_name,
            GROUP_CONCAT(CONCAT(st.row_label, st.seat_num) SEPARATOR ', ') AS seats
     FROM bookings b
     JOIN users u    ON b.user_id  = u.id
     JOIN shows s    ON b.show_id  = s.id
     JOIN movies m   ON s.movie_id = m.id
     JOIN screens sc ON s.screen_id = sc.id
     JOIN theaters t ON sc.theater_id = t.id
     JOIN booking_seats bs ON bs.booking_id = b.id
     JOIN seats st   ON st.id = bs.seat_id
     WHERE b.id = ? AND t.owner_id = ?
     GROUP BY b.id`,
    [booking_id, req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Booking not found or not for your theater.' });
  }

  res.json({ success: true, valid: rows[0].status === 'confirmed', booking: rows[0] });
});

module.exports = { getOwnerTheaters, createTheater, updateTheater, getScreensByTheater, createScreen, getOwnerShows, getOccupancy, getDailySales, verifyTicket };
