const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const emailTestController = require('../controllers/emailTestController');

// All email routes require admin access
router.use(protect);
router.use(adminOnly);

// Test endpoints
router.post('/test', emailTestController.testSendEmail);
router.post('/trigger-expiry', emailTestController.triggerExpiryCheck);

module.exports = router;