// Make sure all models are imported correctly
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
const sequelize = require('../config/database');

// User associations
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Progress, { foreignKey: 'userId', as: 'progress' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Course associations
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Course.hasMany(Subscription, { foreignKey: 'courseId', as: 'subscriptions' });
Subscription.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Module associations
Module.hasMany(Lesson, { foreignKey: 'moduleId', as: 'lessons' });
Lesson.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// Quiz associations
Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'questions' });
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// Export all models
module.exports = {
  sequelize,
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