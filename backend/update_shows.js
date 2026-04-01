require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateShows() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [result] = await pool.query('UPDATE shows SET start_time = DATE_ADD(start_time, INTERVAL 3 DAY) WHERE start_time < NOW();');
  console.log(`Updated ${result.affectedRows} past shows to be 3 days in the future.`);
  
  const [result2] = await pool.query('UPDATE shows SET start_time = DATE_ADD(start_time, INTERVAL 2 DAY) WHERE start_time < DATE_ADD(NOW(), INTERVAL 1 DAY);');
  console.log(`Pushed other near-future shows ahead by 2 days. Affected: ${result2.affectedRows}`);

  process.exit(0);
}

updateShows().catch(console.error);
