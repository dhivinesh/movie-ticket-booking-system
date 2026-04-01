const pool = require('../config/db');
const QRCode = require('qrcode');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendTicketEmail } = require('../services/emailService');

// ── POST /book ───────────────────────────────────────────────
// Full atomic booking with SQL transaction + seat locking
const createBooking = asyncHandler(async (req, res) => {
  const { show_id, seat_ids, payment_method } = req.body;
  const user_id = req.user.id;

  if (!show_id || !seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    return res.status(400).json({ success: false, message: 'show_id and seat_ids[] are required.' });
  }

  const allowedMethods = ['gift_card', 'mock_payment', 'stripe'];
  if (!allowedMethods.includes(payment_method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get show base price
    const [[show]] = await conn.query('SELECT id, price FROM shows WHERE id = ?', [show_id]);
    if (!show) throw Object.assign(new Error('Show not found.'), { statusCode: 404 });

    // 2. Lock seats and get their multipliers
    const placeholders = seat_ids.map(() => '?').join(',');
    const [seats] = await conn.query(
      `SELECT id, status, price_multiplier FROM seats WHERE id IN (${placeholders}) AND show_id = ? FOR UPDATE`,
      [...seat_ids, show_id]
    );

    if (seats.length !== seat_ids.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'One or more seats not found for this show.' });
    }

    const unavailable = seats.filter(s => s.status !== 'available');
    if (unavailable.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'One or more seats are already reserved or booked.' });
    }

    const total_price = seats.reduce((sum, s) => sum + (parseFloat(show.price) * parseFloat(s.price_multiplier)), 0);

    // 3. Handle payment
    if (payment_method === 'gift_card') {
      const [[user]] = await conn.query(
        'SELECT gift_card_balance FROM users WHERE id = ? FOR UPDATE',
        [user_id]
      );
      if (parseFloat(user.gift_card_balance) < parseFloat(total_price)) {
        await conn.rollback();
        return res.status(402).json({
          success: false,
          message: `Insufficient gift card balance. Required: ₹${total_price}, Available: ₹${user.gift_card_balance}`,
        });
      }
      await conn.query(
        'UPDATE users SET gift_card_balance = gift_card_balance - ? WHERE id = ?',
        [total_price, user_id]
      );
    }
    // mock_payment & stripe: always succeed in this implementation

    // 4. Mark seats as booked
    await conn.query(
      `UPDATE seats SET status = 'booked', reserved_at = NULL WHERE id IN (${placeholders})`,
      seat_ids
    );

    // 5. Insert booking record
    const [bookingResult] = await conn.query(
      'INSERT INTO bookings (user_id, show_id, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?)',
      [user_id, show_id, total_price, payment_method, 'confirmed']
    );
    const booking_id = bookingResult.insertId;

    // 6. Insert booking_seats junction
    const bookingSeatValues = seat_ids.map(sid => [booking_id, sid]);
    await conn.query('INSERT INTO booking_seats (booking_id, seat_id) VALUES ?', [bookingSeatValues]);

    // 7. Generate QR code (contains booking ID + user ID for verification)
    const qrData = JSON.stringify({ booking_id, user_id, show_id });
    const qrCode = await QRCode.toDataURL(qrData);

    await conn.query('UPDATE bookings SET qr_code = ? WHERE id = ?', [qrCode, booking_id]);

    await conn.commit();

    // Fetch full booking details for response
    const [bookingDetails] = await conn.query(
      `SELECT b.id, b.total_price, b.payment_method, b.status, b.created_at,
              m.title AS movie_title, m.poster_url,
              s.start_time, s.price AS seat_price,
              t.name AS theater_name, t.location AS theater_location,
              sc.screen_name,
              GROUP_CONCAT(CONCAT(st.row_label, st.seat_num) ORDER BY st.row_label, st.seat_num SEPARATOR ', ') AS seat_numbers
       FROM bookings b
       JOIN shows s     ON b.show_id = s.id
       JOIN movies m    ON s.movie_id = m.id
       JOIN screens sc  ON s.screen_id = sc.id
       JOIN theaters t  ON sc.theater_id = t.id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats st    ON st.id = bs.seat_id
       WHERE b.id = ?
       GROUP BY b.id`,
      [booking_id]
    );

    // Fetch user email for ticketing
    const [[userData]] = await pool.query('SELECT email FROM users WHERE id = ?', [user_id]);

    // Send email asynchronously containing the PDF ticket
    if (userData && userData.email) {
      sendTicketEmail(userData.email, { ...bookingDetails[0], qr_code: qrCode }).catch(err => console.error('Email failed:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed!',
      booking: { ...bookingDetails[0], qr_code: qrCode },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ── GET /user/bookings ───────────────────────────────────────
const getUserBookings = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  const [bookings] = await pool.query(
    `SELECT b.id, b.total_price, b.payment_method, b.status, b.created_at, b.qr_code,
            m.title AS movie_title, m.poster_url, m.genre,
            s.start_time, s.price AS seat_price,
            t.name AS theater_name, t.location,
            sc.screen_name,
            GROUP_CONCAT(CONCAT(st.row_label, st.seat_num) ORDER BY st.row_label SEPARATOR ', ') AS seat_numbers
     FROM bookings b
     JOIN shows s     ON b.show_id = s.id
     JOIN movies m    ON s.movie_id = m.id
     JOIN screens sc  ON s.screen_id = sc.id
     JOIN theaters t  ON sc.theater_id = t.id
     JOIN booking_seats bs ON bs.booking_id = b.id
     JOIN seats st    ON st.id = bs.seat_id
     WHERE b.user_id = ?
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [user_id]
  );

  res.json({ success: true, data: bookings });
});

// ── GET /bookings/:id ────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(
    `SELECT b.id, b.total_price, b.payment_method, b.status, b.created_at, b.qr_code,
            b.user_id,
            m.title AS movie_title, m.poster_url, m.genre, m.duration,
            s.start_time, s.price AS seat_price,
            t.name AS theater_name, t.location,
            sc.screen_name,
            GROUP_CONCAT(CONCAT(st.row_label, st.seat_num) ORDER BY st.row_label SEPARATOR ', ') AS seat_numbers
     FROM bookings b
     JOIN shows s     ON b.show_id = s.id
     JOIN movies m    ON s.movie_id = m.id
     JOIN screens sc  ON s.screen_id = sc.id
     JOIN theaters t  ON sc.theater_id = t.id
     JOIN booking_seats bs ON bs.booking_id = b.id
     JOIN seats st    ON st.id = bs.seat_id
     WHERE b.id = ?
     GROUP BY b.id`,
    [id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Only the booking owner or admin can view
  if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized.' });
  }

  res.json({ success: true, data: rows[0] });
});

// ── DELETE /book/:id (Cancel Booking) ─────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get Booking Details & Lock
    const [[booking]] = await conn.query(
      `SELECT b.*, s.start_time 
       FROM bookings b 
       JOIN shows s ON b.show_id = s.id 
       WHERE b.id = ? 
       FOR UPDATE`,
      [id]
    );

    if (!booking) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.user_id !== user_id && req.user.role !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ success: false, message: 'Unauthorized cancellation.' });
    }

    if (booking.status === 'cancelled') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    if (new Date(booking.start_time) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cannot cancel a past show.' });
    }

    // 2. Mark as Cancelled
    await conn.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);

    // 3. Free the Seats
    const [bsRows] = await conn.query('SELECT seat_id FROM booking_seats WHERE booking_id = ?', [id]);
    const seatIds = bsRows.map(bs => bs.seat_id);
    if (seatIds.length > 0) {
      const placeholders = seatIds.map(() => '?').join(',');
      await conn.query(`UPDATE seats SET status = 'available' WHERE id IN (${placeholders})`, seatIds);
    }

    // 4. Refund Gift Card Balance
    if (booking.payment_method === 'gift_card') {
      await conn.query(
        'UPDATE users SET gift_card_balance = gift_card_balance + ? WHERE id = ?',
        [booking.total_price, booking.user_id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Booking cancelled successfully.' });

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };
