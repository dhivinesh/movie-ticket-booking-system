const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Default values, can be overridden by .env
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'movie_booking';

const TMDB_API_KEY = process.env.TMDB_API_KEY || ''; // Needs actual key

if (!TMDB_API_KEY) {
  console.error('\n❌ ERROR: TMDB_API_KEY is not defined in your .env file.');
  console.error('Please visit https://developer.themoviedb.org/docs to get an API key.');
  console.error('Add it to your backend/.env file and run this script again:\n');
  process.exit(1);
}

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
};

async function seedTMDB() {
  let pool;
  try {
    pool = await mysql.createPool(dbConfig);
    console.log('✅ Connected to database.');

    console.log('Fetching Latest Movies from TMDB...');
    const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
    
    const results = tmdbResponse.data.results;
    if (!results || results.length === 0) {
      console.log('No movies returned from TMDB.');
      return;
    }

    console.log(`🎬 Fetched ${results.length} movies. Inserting into database...`);

    let insertedCount = 0;

    for (const movie of results) {
      // Basic genre map handling (TMDB returns genre IDs, we'll store basic text mappings for a few common ones)
      const genreMap = { 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western' };
      
      const genreText = movie.genre_ids && movie.genre_ids.length > 0 
        ? genreMap[movie.genre_ids[0]] || 'Drama'
        : 'Drama';

      const posterUrl = movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null;

      const duration = Math.floor(Math.random() * (180 - 90 + 1)) + 90; // mock duration 90-180m since now_playing doesn't send runtime
      const language = movie.original_language ? movie.original_language.toUpperCase() : 'EN';
      const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '7.5';

      try {
        const [insertRes] = await pool.query(
          `INSERT INTO movies (title, description, duration, language, genre, poster_url, rating)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [movie.title, movie.overview, duration, language, genreText, posterUrl, rating]
        );
        insertedCount++;
        const movieId = insertRes.insertId;

        // Optionally, generate some mock shows automatically for these real movies 
        // We will assume Theater ID 1 and Screen ID 1 and 2 exist from seed.sql
        const timeOffset = Math.floor(Math.random() * 5) + 1; // 1-5 days from now
        const showTime = new Date();
        showTime.setDate(showTime.getDate() + timeOffset);
        showTime.setHours(18, 0, 0, 0); // 6 PM
        
        const screenId = Math.random() > 0.5 ? 1 : 2;
        
        await pool.query(
          `INSERT INTO shows (movie_id, screen_id, start_time, price) VALUES (?, ?, ?, ?)`,
          [movieId, screenId, showTime, 250.00]
        );

      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`Skipping duplicate: ${movie.title}`);
        } else {
          console.error(`Error inserting ${movie.title}:`, err.message);
        }
      }
    }

    console.log(`\n🎉 TMDB Seeding Complete! Inserted ${insertedCount} new movies and created mock shows for them.`);

  } catch (err) {
    if (err.response) {
      console.error('❌ TMDB API Error:', err.response.data);
    } else {
      console.error('❌ Database/Setup Error:', err.message);
    }
  } finally {
    if (pool) await pool.end();
    process.exit(0);
  }
}

seedTMDB();
