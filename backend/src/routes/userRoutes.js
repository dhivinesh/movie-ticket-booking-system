const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { getUserBookings } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

// GET  /user/profile
router.get('/profile',  verifyToken, getProfile);

// PUT  /user/profile
router.put('/profile',  verifyToken, updateProfile);

// GET  /user/bookings
router.get('/bookings', verifyToken, getUserBookings);

module.exports = router;
