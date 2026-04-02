const User = require('./User');
const Subscription = require('./Subscription');
const Course = require('./Course');
const Module = require('./Module');
const Lesson = require('./Lesson');
const Progress = require('./Progress');
const Certificate = require('./Certificate');
const Quiz = require('./Quiz');
const QuizQuestion = require('./QuizQuestion');
const QuizAttempt = require('./QuizAttempt');

// ============ USER ASSOCIATIONS ============
// User - Subscription (One to Many)
User.hasMany(Subscription, { 
  foreignKey: 'userId', 
  as: 'subscriptions', 
  onDelete: 'CASCADE' 
});
Subscription.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// ============ COURSE ASSOCIATIONS ============
// Course - Subscription (One to Many)
Course.hasMany(Subscription, { 
  foreignKey: 'courseId', 
  as: 'subscriptions', 
  onDelete: 'CASCADE' 
});
Subscription.belongsTo(Course, { 
  foreignKey: 'courseId', 
  as: 'course' 
});

// Course - Module (One to Many)
Course.hasMany(Module, { 
  foreignKey: 'courseId', 
  as: 'modules', 
  onDelete: 'CASCADE' 
});
Module.belongsTo(Course, { 
  foreignKey: 'courseId', 
  as: 'course' 
});

// ============ MODULE ASSOCIATIONS ============
// Module - Lesson (One to Many)
Module.hasMany(Lesson, { 
  foreignKey: 'moduleId', 
  as: 'lessons', 
  onDelete: 'CASCADE' 
});
Lesson.belongsTo(Module, { 
  foreignKey: 'moduleId', 
  as: 'module' 
});

// ============ PROGRESS ASSOCIATIONS ============
// User - Progress (One to Many)
User.hasMany(Progress, { 
  foreignKey: 'userId', 
  as: 'progress', 
  onDelete: 'CASCADE' 
});
Progress.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Lesson - Progress (One to Many)
Lesson.hasMany(Progress, { 
  foreignKey: 'lessonId', 
  as: 'progress', 
  onDelete: 'CASCADE' 
});
Progress.belongsTo(Lesson, { 
  foreignKey: 'lessonId', 
  as: 'lesson' 
});

// Certificate associations
User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Quiz associations
Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Module.hasMany(Quiz, { foreignKey: 'moduleId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// QuizQuestion associations
Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// QuizAttempt associations
User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// ============ EXPORT ALL MODELS ============
module.exports = {
  User,
  Subscription,
  Course,
  Module,
  Lesson,
  Progress,
  Certificate,
  Quiz,
  QuizQuestion,
  QuizAttempt,
};