const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const courseController = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');
const adminStatsController = require('../controllers/adminStatsController');
const analyticsController = require('../controllers/analyticsController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(adminOnly);

// admin stats
router.get('/stats', adminStatsController.getStats);

// Course routes
router.post('/courses', courseController.createCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);
router.get('/analytics', analyticsController.getAnalytics);

// Module routes
router.post('/courses/:courseId/modules', moduleController.addModule);
router.put('/modules/:id', moduleController.updateModule);
router.delete('/modules/:id', moduleController.deleteModule);

// Lesson routes
router.post('/modules/:moduleId/lessons', lessonController.addLesson);
router.put('/lessons/:id', lessonController.updateLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);

module.exports = router;