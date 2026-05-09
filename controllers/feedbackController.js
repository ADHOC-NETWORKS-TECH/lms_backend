const { Feedback, User } = require('../models/associations');

exports.submitFeedback = async (req, res) => {
  try {
    const { content, rating } = req.body;
    const userId = req.user.id;

    if (!content || !rating) {
      return res.status(400).json({ success: false, message: 'Content and rating are required.' });
    }

    const feedback = await Feedback.create({
      userId,
      content,
      rating
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting feedback.' });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching feedbacks.' });
  }
};

exports.updateFeedbackDisplay = async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnHome } = req.body;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    feedback.showOnHome = showOnHome;
    await feedback.save();

    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while updating feedback.' });
  }
};

exports.getHomeFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.findAll({
      where: { showOnHome: true },
      include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching home feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching home feedbacks.' });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    
    await feedback.destroy();
    res.status(200).json({ success: true, message: 'Feedback deleted successfully.' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting feedback.' });
  }
};
