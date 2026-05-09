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
const Ticket = require('./Ticket');
const Blog = require('./Blog');
const Feedback = require('./Feedback');

// User associations
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Progress, { foreignKey: 'userId', as: 'progress' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Feedback, { foreignKey: 'userId', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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

User.hasMany(Ticket, { foreignKey: 'userId', as: 'tickets' });
Ticket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Course.hasMany(Ticket, { foreignKey: 'courseId', as: 'tickets' });
Ticket.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

Lesson.hasMany(Ticket, { foreignKey: 'lessonId', as: 'tickets' });
Ticket.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });

Module.hasMany(Quiz, { foreignKey: 'moduleId', as: 'quizzes' });
Quiz.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

User.hasMany(Blog, { foreignKey: 'authorId', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

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
  Ticket,
  Blog,
  Feedback,
};
