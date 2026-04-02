const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mockPaymentController = require('../controllers/mockPaymentController');

// All payment routes require authentication
router.use(protect);

// Mock payment endpoints
router.post('/create-order', mockPaymentController.createOrder);
router.post('/verify', mockPaymentController.verifyPayment);
router.post('/mock-purchase', mockPaymentController.mockPurchase); // Simplest: one step purchase

module.exports = router;