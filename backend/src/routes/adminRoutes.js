const express = require('express');
const router = express.Router();
const { getAnalytics, getAllUsers, deactivateUser, activateUser, getAllTransactions } = require('../controllers/adminController');
const { getAllGiftCards, createGiftCard, toggleGiftCard } = require('../controllers/giftCardController');
const { verifyToken, requireRole } = require('../middleware/auth');

const adminOnly = [verifyToken, requireRole('admin')];

// Analytics
router.get('/analytics',               ...adminOnly, getAnalytics);

// User management
router.get('/users',                   ...adminOnly, getAllUsers);
router.put('/users/:id/deactivate',    ...adminOnly, deactivateUser);
router.put('/users/:id/activate',      ...adminOnly, activateUser);

// Transactions
router.get('/transactions',            ...adminOnly, getAllTransactions);

// Gift cards
router.get('/giftcards',               ...adminOnly, getAllGiftCards);
router.post('/giftcards',              ...adminOnly, createGiftCard);
router.put('/giftcards/:id/toggle',    ...adminOnly, toggleGiftCard);

module.exports = router;
