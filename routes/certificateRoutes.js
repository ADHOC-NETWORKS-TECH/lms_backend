const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const certificateController = require('../controllers/certificateController');

// Public route (no authentication required)
router.get('/verify/:verificationCode', certificateController.verifyCertificate);

// Protected routes (require login)
router.use(protect);

// Generate certificate for a course
router.post('/generate/:courseId', certificateController.generateCertificate);

// Get user's certificates
router.get('/my', certificateController.getMyCertificates);

// Download certificate PDF
router.get('/:certificateId/download', certificateController.downloadCertificate);
// Admin routes
router.get('/all', adminOnly, certificateController.getAllCertificates);

module.exports = router;