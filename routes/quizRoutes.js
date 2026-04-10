const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// Student routes (require login)
router.use(protect);

// Get quizzes for a course
router.get('/course/:courseId', quizController.getCourseQuizzes);

// Get single quiz
router.get('/:quizId', quizController.getQuiz);

// Submit quiz
router.post('/:quizId/submit', quizController.submitQuiz);

// Get user's attempts
router.get('/attempts/my', quizController.getMyAttempts);

// Admin only routes
router.post('/', adminOnly, quizController.createQuiz);
router.post('/:quizId/questions', adminOnly, quizController.addQuestions);

module.exports = router;