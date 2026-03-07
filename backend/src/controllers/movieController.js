const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /movies  (with optional ?search=&genre=&page=) ───────
const getAllMovies = asyncHandler(async (req, res) => {
  const { search = '', genre = '', page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE m.is_active = 1';
  const params = [];

  if (search) {
    whereClause += ' AND m.title LIKE ?';
    params.push(`%${search}%`);
  }
  if (genre) {
    whereClause += ' AND m.genre = ?';
    params.push(genre);
  }

  const [movies] = await pool.query(
    `SELECT m.* FROM movies m ${whereClause} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM movies m ${whereClause}`,
    params
  );

  res.json({ success: true, data: movies, total, page: parseInt(page), limit: parseInt(limit) });
});

// ── GET /movies/:id ──────────────────────────────────────────
const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [movies] = await pool.query(
    'SELECT * FROM movies WHERE id = ? AND is_active = 1',
    [id]
  );
  if (movies.length === 0) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  res.json({ success: true, data: movies[0] });
});

// ── GET /movies/genres  (distinct genre list) ────────────────
const getGenres = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT DISTINCT genre FROM movies WHERE is_active = 1 ORDER BY genre'
  );
  res.json({ success: true, data: rows.map(r => r.genre) });
});

// ── POST /admin/movies ───────────────────────────────────────
const createMovie = asyncHandler(async (req, res) => {
  const { title, genre, duration, description, poster_url, language, rating } = req.body;

  if (!title || !genre || !duration) {
    return res.status(400).json({ success: false, message: 'Title, genre and duration are required.' });
  }

  const [result] = await pool.query(
    'INSERT INTO movies (title, genre, duration, description, poster_url, language, rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, genre, parseInt(duration), description || '', poster_url || '', language || 'English', parseFloat(rating) || 0.0]
  );

  res.status(201).json({ success: true, message: 'Movie created.', id: result.insertId });
});

// ── PUT /admin/movies/:id ────────────────────────────────────
const updateMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, genre, duration, description, poster_url, language, rating, is_active } = req.body;

  await pool.query(
    `UPDATE movies SET
       title = COALESCE(?, title),
       genre = COALESCE(?, genre),
       duration = COALESCE(?, duration),
       description = COALESCE(?, description),
       poster_url = COALESCE(?, poster_url),
       language = COALESCE(?, language),
       rating = COALESCE(?, rating),
       is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [title, genre, duration, description, poster_url, language, rating, is_active, id]
  );

  res.json({ success: true, message: 'Movie updated.' });
});

// ── DELETE /admin/movies/:id ─────────────────────────────────
const deleteMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE movies SET is_active = 0 WHERE id = ?', [id]);
  res.json({ success: true, message: 'Movie deactivated.' });
});

module.exports = { getAllMovies, getMovieById, getGenres, createMovie, updateMovie, deleteMovie };
