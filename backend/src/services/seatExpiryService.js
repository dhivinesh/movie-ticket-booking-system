const pool = require('../config/db');

/**
 * Seat Expiry Service
 * Run on a cron schedule to release reserved seats that have exceeded the lock timeout.
 * Default: 10 minutes (configurable via SEAT_RESERVE_MINUTES env var)
 */
const expireReservedSeats = async () => {
  const minutes = parseInt(process.env.SEAT_RESERVE_MINUTES || '10', 10);
  try {
    const [result] = await pool.query(
      `UPDATE seats 
       SET status = 'available', reserved_at = NULL
       WHERE status = 'reserved'
         AND reserved_at IS NOT NULL
         AND reserved_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [minutes]
    );
    if (result.affectedRows > 0) {
      console.log(`🔓 Released ${result.affectedRows} expired seat reservation(s)`);
    }
  } catch (err) {
    console.error('❌ Error expiring reserved seats:', err.message);
  }
};

module.exports = { expireReservedSeats };
