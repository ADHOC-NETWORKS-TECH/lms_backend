const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const progressController = require('../controllers/progressController');

// All progress routes require authentication
router.use(protect);

// Mark/unmark lesson complete
router.post('/lesson/:lessonId/complete', progressController.markLessonComplete);
router.delete('/lesson/:lessonId/complete', progressController.unmarkLessonComplete);

// Get progress
router.get('/course/:courseId', progressController.getCourseProgress);
router.get('/overall', progressController.getOverallProgress);

module.exports = router;