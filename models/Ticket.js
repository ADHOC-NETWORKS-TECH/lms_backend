const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id',
    },
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'lessons',
      key: 'id',
    },
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'in-progress', 'resolved', 'closed'),
    defaultValue: 'open',
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'tickets',
});

module.exports = Ticket;