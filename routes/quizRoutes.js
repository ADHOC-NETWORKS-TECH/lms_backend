const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const quizController = require('../controllers/quizController');

router.use(protect);
router.get('/attempts', quizController.getMyAttempts);
router.post('/:quizId/submit', quizController.submitQuiz);
router.get('/:quizId', quizController.getQuiz);

router.use(adminOnly);
router.post('/', quizController.createQuiz);
router.post('/:quizId/questions', quizController.addQuestions);

module.exports = router;