const express = require('express');
const router = express.Router();
const { redeemGiftCard } = require('../controllers/giftCardController');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /giftcard/redeem  (customers only)
router.post('/redeem', verifyToken, requireRole('customer'), redeemGiftCard);

module.exports = router;
