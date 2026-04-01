require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Adding status column to shows...');
    await pool.query("ALTER TABLE shows ADD COLUMN status ENUM('scheduled', 'cancelled') DEFAULT 'scheduled';");
  } catch(e) { console.log('shows.status mapping issue:', e.message); }

  try {
    console.log('Adding status column to bookings...');
    await pool.query("ALTER TABLE bookings ADD COLUMN status ENUM('active', 'cancelled', 'refunded') DEFAULT 'active';");
  } catch(e) { console.log('bookings.status mapping issue:', e.message); }

  try {
    console.log('Adding tier and price_multiplier columns to seats...');
    await pool.query("ALTER TABLE seats ADD COLUMN tier VARCHAR(50) DEFAULT 'Standard';");
    await pool.query("ALTER TABLE seats ADD COLUMN price_multiplier DECIMAL(3,2) DEFAULT 1.00;");
  } catch(e) { console.log('seats alterations mapping issue:', e.message); }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(console.error);
