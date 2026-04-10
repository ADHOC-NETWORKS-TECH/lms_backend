const { Quiz, QuizQuestion, QuizAttempt, Course } = require('../models/associations');

// Create quiz (Admin only)
exports.createQuiz = async (req, res) => {
  try {
    console.log('📝 Create quiz request:', req.body);
    
    const { courseId, title, description, type, passingScore, timeLimit } = req.body;
    
    // Validate required fields
    if (!courseId || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Course ID and title are required' 
      });
    }
    
    const quiz = await Quiz.create({
      courseId,
      title,
      description: description || '',
      type: type || 'final',
      passingScore: passingScore || 70,
      timeLimit: timeLimit || 30
    });
    
    console.log('✅ Quiz created:', quiz.id);
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('❌ Create quiz error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get quizzes for a course
exports.getCourseQuizzes = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.findAll({
      where: { courseId },
      include: [{ model: QuizQuestion, as: 'questions' }]
    });
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Get course quizzes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single quiz
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: QuizQuestion, as: 'questions' }]
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

// Add questions to quiz
exports.addQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, message: 'Questions array is required' });
    }
    
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

// Submit quiz
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
    
    for (const question of quiz.questions) {
      totalPoints += question.points;
      if (answers[question.id] === question.correctAnswer) {
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
      answers,
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

// Get user's attempts
exports.getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [{ model: Quiz, as: 'quiz' }],
      order: [['completedAt', 'DESC']]
    });
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};