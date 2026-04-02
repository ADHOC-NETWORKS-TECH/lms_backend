const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

// Public routes
router.get('/course/:courseId/plans', subscriptionController.getPlansForCourse);

// Protected routes (require login)
router.use(protect);
router.post('/create', subscriptionController.createSubscription);
router.get('/my', subscriptionController.getMySubscriptions);
router.get('/course/:courseId/access', subscriptionController.checkCourseAccess);
router.get('/course/:courseId/history', subscriptionController.getCourseSubscriptionHistory);

// Admin only routes
router.get('/all', adminOnly, subscriptionController.getAllSubscriptions);
router.get('/expiring', adminOnly, subscriptionController.getExpiringSubscriptions);
router.post('/extend', adminOnly, subscriptionController.extendSubscription);

module.exports = router;