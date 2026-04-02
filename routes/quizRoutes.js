const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// Protected routes (require login)
router.use(protect);

// Quiz attempts
router.get('/attempts', quizController.getQuizAttempts);
router.post('/:quizId/submit', quizController.submitQuiz);
router.get('/:quizId', quizController.getQuiz);

// Admin only routes
router.use(adminOnly);
router.post('/', quizController.createQuiz);
router.post('/:quizId/questions', quizController.addQuestions);

module.exports = router;