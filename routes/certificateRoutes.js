const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const certificateController = require('../controllers/certificateController');

// Public route - verify certificate
router.get('/verify/:verificationCode', certificateController.verifyCertificate);

// Protected routes (require login)
router.use(protect);
router.post('/generate/:courseId', certificateController.generateCertificate);
router.get('/my', certificateController.getMyCertificates);
router.get('/:certificateId/download', certificateController.downloadCertificate);

// Admin only routes
router.get('/all', adminOnly, certificateController.getAllCertificates);

module.exports = router;