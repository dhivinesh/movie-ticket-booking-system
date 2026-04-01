require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [rows] = await pool.query('SELECT id, movie_id, start_time, start_time > NOW() as is_upcoming, NOW() as db_now FROM shows;');
  fs.writeFileSync('shows_output.json', JSON.stringify(rows, null, 2), 'utf8');
  console.log('Written to shows_output.json');
  process.exit(0);
}

check().catch(console.error);
