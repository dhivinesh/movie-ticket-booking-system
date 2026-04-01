const express = require('express');
const router = express.Router();
const { getShowsByMovie, getShowsByScreen, createShow, cancelShow } = require('../controllers/showController');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /shows/:movieId
router.get('/:movieId', getShowsByMovie);

// GET /shows/screen/:screenId
router.get('/screen/:screenId', getShowsByScreen);

// POST /shows  (theater owner creates a show)
router.post('/', verifyToken, requireRole('theater_owner'), createShow);

// DELETE /shows/:id (theater owner cancels a show)
router.delete('/:id', verifyToken, requireRole('theater_owner'), cancelShow);

module.exports = router;
