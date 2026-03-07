const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById, getGenres, createMovie, updateMovie, deleteMovie } = require('../controllers/movieController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/',        getAllMovies);
router.get('/genres',  getGenres);
router.get('/:id',     getMovieById);

// Admin only
router.post('/',     verifyToken, requireRole('admin'), createMovie);
router.put('/:id',   verifyToken, requireRole('admin'), updateMovie);
router.delete('/:id',verifyToken, requireRole('admin'), deleteMovie);

module.exports = router;
