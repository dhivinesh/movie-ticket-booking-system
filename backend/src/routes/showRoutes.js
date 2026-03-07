const express = require('express');
const router = express.Router();
const { getShowsByMovie, getShowsByScreen, createShow } = require('../controllers/showController');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /shows/:movieId
router.get('/:movieId', getShowsByMovie);

// GET /shows/screen/:screenId
router.get('/screen/:screenId', getShowsByScreen);

// POST /shows  (theater owner creates a show)
router.post('/', verifyToken, requireRole('theater_owner'), createShow);

module.exports = router;
