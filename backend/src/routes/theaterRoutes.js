const express = require('express');
const router = express.Router();
const {
  getOwnerTheaters, createTheater, updateTheater,
  getScreensByTheater, createScreen,
  getOwnerShows,
  getOccupancy,
  getDailySales,
  verifyTicket,
} = require('../controllers/theaterController');
const { verifyToken, requireRole } = require('../middleware/auth');

const ownerOnly = [verifyToken, requireRole('theater_owner')];

// Theaters
router.get('/theaters',              ...ownerOnly, getOwnerTheaters);
router.post('/theaters',             ...ownerOnly, createTheater);
router.put('/theaters/:id',          ...ownerOnly, updateTheater);

// Screens
router.get('/screens/:theaterId',    ...ownerOnly, getScreensByTheater);
router.post('/screens',              ...ownerOnly, createScreen);

// Shows
router.get('/shows',                 ...ownerOnly, getOwnerShows);

// Occupancy (real-time)
router.get('/occupancy/:showId',     ...ownerOnly, getOccupancy);

// Daily sales
router.get('/sales',                 ...ownerOnly, getDailySales);

// Verify ticket via QR
router.post('/verify-ticket',        ...ownerOnly, verifyTicket);

module.exports = router;
