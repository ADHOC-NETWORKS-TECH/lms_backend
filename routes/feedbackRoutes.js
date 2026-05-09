const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedbacks, updateFeedbackDisplay, getHomeFeedbacks, deleteFeedback } = require('../controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/', protect, adminOnly, getAllFeedbacks);
router.put('/:id/display', protect, adminOnly, updateFeedbackDisplay);
router.get('/home', getHomeFeedbacks);
router.delete('/:id', protect, adminOnly, deleteFeedback);

module.exports = router;
