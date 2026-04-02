const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { checkCourseAccess } = require('../middleware/courseAccessMiddleware');
const courseController = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const lessonController = require('../controllers/lessonController');

// Public routes
router.get('/', courseController.getAllCourses);

// Protected routes (require login)
router.get('/my-courses', protect, courseController.getMyCourses);
router.get('/:id', protect, courseController.getCourseById);

// IMPORTANT: The order matters! Put specific routes before parameter routes
router.get('/:id/modules', protect, checkCourseAccess, moduleController.getCourseModules);
router.get('/lessons/:id', protect, lessonController.getLessonById);

module.exports = router;