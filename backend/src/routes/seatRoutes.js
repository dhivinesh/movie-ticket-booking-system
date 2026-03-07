const express = require('express');
const router = express.Router();
const { getSeatsByShow } = require('../controllers/seatController');

// GET /seats/:showId
router.get('/:showId', getSeatsByShow);

module.exports = router;
