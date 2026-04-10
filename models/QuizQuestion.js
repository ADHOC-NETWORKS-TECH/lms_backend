const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  questionText: { type: DataTypes.TEXT, allowNull: false },
  options: { type: DataTypes.JSON, allowNull: false },
  correctAnswer: { type: DataTypes.INTEGER, allowNull: false },
  explanation: { type: DataTypes.TEXT },
  points: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { timestamps: true });

module.exports = QuizQuestion;