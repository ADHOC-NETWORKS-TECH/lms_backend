const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  quizId: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.INTEGER, defaultValue: 0 },
  percentage: { type: DataTypes.INTEGER, defaultValue: 0 },
  answers: { type: DataTypes.JSON },
  passed: { type: DataTypes.BOOLEAN, defaultValue: false },
  completedAt: { type: DataTypes.DATE },
}, { timestamps: true });

module.exports = QuizAttempt;