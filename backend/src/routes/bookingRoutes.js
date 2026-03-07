const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getBookingById, cancelBooking } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

// POST /book
router.post('/', verifyToken, createBooking);

// GET /book/:id
router.get('/:id', verifyToken, getBookingById);

// GET /user/bookings (proxied through user routes but added here for completeness)
router.get('/user/all', verifyToken, getUserBookings);

// DELETE /book/:id
router.delete('/:id', verifyToken, cancelBooking);

module.exports = router;
