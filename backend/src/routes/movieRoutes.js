const express = require('express');
const router = express.Router();
const { getAllMovies, getMovieById, getGenres, createMovie, updateMovie, deleteMovie } = require('../controllers/movieController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/',        getAllMovies);
router.get('/genres',  getGenres);
router.get('/:id',     getMovieById);

// Admin & Theater Owner
router.post('/',     verifyToken, requireRole('admin', 'theater_owner'), createMovie);
router.put('/:id',   verifyToken, requireRole('admin', 'theater_owner'), updateMovie);
router.delete('/:id',verifyToken, requireRole('admin', 'theater_owner'), deleteMovie);

module.exports = router;
