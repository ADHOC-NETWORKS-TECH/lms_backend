const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const passwordController = require('../controllers/passwordController');

// Public routes
router.post('/forgot', passwordController.forgotPassword);
router.post('/reset/:token', passwordController.resetPassword);
router.get('/verify/:token', passwordController.verifyResetToken);

// Protected routes (require login)
router.post('/change', protect, passwordController.changePassword);

module.exports = router;