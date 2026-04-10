const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING, defaultValue: 'final' },
  passingScore: { type: DataTypes.INTEGER, defaultValue: 70 },
  timeLimit: { type: DataTypes.INTEGER, defaultValue: 30 },
}, { timestamps: true });

module.exports = Quiz;