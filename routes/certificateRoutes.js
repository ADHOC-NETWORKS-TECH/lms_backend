const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const certificateController = require('../controllers/certificateController');

// Public route
router.get('/verify/:verificationCode', certificateController.verifyCertificate);

// Protected routes
router.use(protect);
router.post('/generate/:courseId', certificateController.generateCertificate);
router.get('/my', certificateController.getMyCertificates);
router.get('/:certificateId/download', certificateController.downloadCertificate);

module.exports = router;