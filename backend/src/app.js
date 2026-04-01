const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes    = require('./routes/authRoutes');
const movieRoutes   = require('./routes/movieRoutes');
const showRoutes    = require('./routes/showRoutes');
const seatRoutes    = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes    = require('./routes/userRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const giftCardRoutes= require('./routes/giftCardRoutes');
const theaterRoutes = require('./routes/theaterRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Vercel Cron Endpoint ─────────────────────────────────────
const { expireReservedSeats } = require('./services/seatExpiryService');
app.get('/cron/expire-seats', async (req, res) => {
  try {
    await expireReservedSeats();
    return res.json({ success: true, message: 'Seat expiry cron executed.' });
  } catch (error) {
    console.error('Seat expiry cron error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ── Routes ───────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/movies',        movieRoutes);
app.use('/shows',         showRoutes);
app.use('/seats',         seatRoutes);
app.use('/book',          bookingRoutes);
app.use('/user',          userRoutes);
app.use('/admin',         adminRoutes);
app.use('/giftcard',      giftCardRoutes);
app.use('/owner',         theaterRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Central error handler ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
