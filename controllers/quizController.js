const { Quiz, QuizQuestion, QuizAttempt, Course, Module } = require('../models/associations');
const { Op } = require('sequelize');

// Create quiz (Admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { courseId, moduleId, title, description, type, passingScore, timeLimit, order } = req.body;
    
    const quiz = await Quiz.create({
      courseId,
      moduleId: moduleId || null,
      title,
      description,
      type: type || (moduleId ? 'module' : 'final'),
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 30,
      order: order || 0
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

// Get quizzes for a course (grouped by module)
exports.getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const quizzes = await Quiz.findAll({
      where: { courseId },
      include: [
        { model: QuizQuestion, as: 'questions' },
        { model: Module, as: 'module', attributes: ['id', 'title', 'order'] }
      ],
      order: [
        ['type', 'ASC'],
        ['order', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });
    
    // Separate module quizzes and final quiz
    const moduleQuizzes = quizzes.filter(q => q.type === 'module');
    const finalQuiz = quizzes.find(q => q.type === 'final');
    
    res.json({
      success: true,
      data: {
        moduleQuizzes,
        finalQuiz
      }
    });
  } catch (error) {
    console.error('Get course quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get quizzes for a specific module
exports.getModuleQuizzes = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    const quizzes = await Quiz.findAll({
      where: { moduleId, type: 'module' },
      include: [{ model: QuizQuestion, as: 'questions' }],
      order: [['order', 'ASC']]
    });
    
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Get module quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single quiz
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await Quiz.findByPk(quizId, {
      include: [
        { model: QuizQuestion, as: 'questions', attributes: ['id', 'questionText', 'options', 'points'] },
        { model: Module, as: 'module', attributes: ['id', 'title'] }
      ]
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
    
    // Check if already attempted (optional: allow retakes)
    const existingAttempt = await QuizAttempt.findOne({
      where: { userId, quizId, passed: true }
    });
    
    if (existingAttempt && quiz.type === 'final') {
      return res.status(400).json({
        success: false,
        message: 'You have already passed this quiz'
      });
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
        passingScore: quiz.passingScore,
        quizType: quiz.type,
        moduleId: quiz.moduleId
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
      include: [
        {
          model: Quiz,
          as: 'quiz',
          include: [
            { model: Course, as: 'course', attributes: ['id', 'title'] },
            { model: Module, as: 'module', attributes: ['id', 'title'] }
          ]
        }
      ],
      order: [['completedAt', 'DESC']]
    });
    
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check if module quiz is completed/passed
exports.checkModuleQuizStatus = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    
    const quiz = await Quiz.findOne({
      where: { moduleId, type: 'module' }
    });
    
    if (!quiz) {
      return res.json({ success: true, data: { exists: false } });
    }
    
    const attempt = await QuizAttempt.findOne({
      where: { userId, quizId: quiz.id, passed: true }
    });
    
    res.json({
      success: true,
      data: {
        exists: true,
        quizId: quiz.id,
        passed: !!attempt,
        attempt
      }
    });
  } catch (error) {
    console.error('Check module quiz status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};