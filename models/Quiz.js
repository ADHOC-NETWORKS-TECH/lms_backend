const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id',
    },
  },
  moduleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'modules',
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'module',
    validate: {
      isIn: [['module', 'final']],
    },
  },
  passingScore: {
    type: DataTypes.INTEGER,
    defaultValue: 70,
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Time limit in minutes',
  },
}, {
  timestamps: true,
  tableName: 'quizzes',
});

module.exports = Quiz;