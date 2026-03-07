require('dotenv').config();
const app = require('./app');
const cron = require('node-cron');
const { expireReservedSeats } = require('./services/seatExpiryService');

// Require the DB connection pool (initialises + tests the connection)
require('./config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  // ── Seat Expiry Cron Job ─────────────────────────────────
  // Runs every minute to check for expired seat reservations
  cron.schedule('* * * * *', expireReservedSeats);
  console.log('⏰ Seat expiry cron job started (runs every minute)');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
