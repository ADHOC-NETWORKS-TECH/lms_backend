const { Quiz, QuizQuestion, QuizAttempt, Course, User } = require('../models/associations');
const { Op } = require('sequelize');

// Create quiz (Admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { courseId, title, description, type, passingScore, timeLimit } = req.body;
    
    const quiz = await Quiz.create({
      courseId,
      title,
      description,
      type: type || 'final',
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 30
    });
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add questions to quiz (Admin only)
exports.addQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;
    
    const createdQuestions = [];
    for (const q of questions) {
      const question = await QuizQuestion.create({
        quizId,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points || 1
      });
      createdQuestions.push(question);
    }
    
    res.json({
      success: true,
      message: `${createdQuestions.length} questions added`,
      data: createdQuestions
    });
  } catch (error) {
    console.error('Add questions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quiz for student
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findByPk(quizId, {
      include: [{
        model: QuizQuestion,
        as: 'questions',
        attributes: ['id', 'questionText', 'options', 'points']
      }]
    });
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit quiz attempt
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;
    
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: QuizQuestion, as: 'questions' }]
    });
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    let totalPoints = 0;
    let earnedPoints = 0;
    const userAnswers = {};
    
    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      userAnswers[question.id] = userAnswer;
      
      if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
        earnedPoints += question.points;
      }
    }
    
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;
    
    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      score: earnedPoints,
      percentage,
      answers: userAnswers,
      passed,
      completedAt: new Date()
    });
    
    res.json({
      success: true,
      data: {
        attemptId: attempt.id,
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        passingScore: quiz.passingScore
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's quiz attempts
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [{
        model: Quiz,
        as: 'quiz',
        include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }]
      }],
      order: [['completedAt', 'DESC']]
    });
    
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};