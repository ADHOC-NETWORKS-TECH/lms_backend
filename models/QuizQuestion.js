const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quizzes',
      key: 'id',
    },
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of options: ["Option 1", "Option 2", "Option 3", "Option 4"]',
  },
  correctAnswer: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Index of correct answer (0-based)',
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
}, {
  timestamps: true,
  tableName: 'quiz_questions',
});

module.exports = QuizQuestion;