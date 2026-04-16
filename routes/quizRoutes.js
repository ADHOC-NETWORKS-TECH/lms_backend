const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

// Student routes (require login)
router.use(protect);

// Get quizzes for a course
router.get('/course/:courseId', quizController.getCourseQuizzes);

// Get quizzes for a module
router.get('/module/:moduleId', quizController.getModuleQuizzes);

// Check module quiz status
router.get('/module/:moduleId/status', quizController.checkModuleQuizStatus);

// Get single quiz
router.get('/:quizId', quizController.getQuiz);

// Submit quiz
router.post('/:quizId/submit', quizController.submitQuiz);

// Get user's quiz attempts
router.get('/attempts/my', quizController.getMyAttempts);

// Admin only routes
router.post('/', adminOnly, quizController.createQuiz);
router.put('/:quizId', adminOnly, quizController.updateQuiz);  // ← UPDATE QUIZ
router.delete('/:quizId', adminOnly, quizController.deleteQuiz);  // ← DELETE QUIZ
router.post('/:quizId/questions', adminOnly, quizController.addQuestions);
router.put('/questions/:questionId', adminOnly, quizController.updateQuestion);  // ← UPDATE QUESTION
router.delete('/questions/:questionId', adminOnly, quizController.deleteQuestion);  // ← DELETE QUESTION
router.get('/questions/:questionId', adminOnly, quizController.getQuestion);

module.exports = router;