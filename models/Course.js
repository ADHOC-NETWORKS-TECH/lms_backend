const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  thumbnail: {
    type: DataTypes.STRING,
  },
  // Custom prices for each subscription plan
  price_1month: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 499,
    comment: 'Price for 1 month access'
  },
  price_3months: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1299,
    comment: 'Price for 3 months access'
  },
  price_6months: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 2499,
    comment: 'Price for 6 months access'
  },
  course_type: {
    type: DataTypes.STRING,
    defaultValue: 'mega',
    validate: {
      isIn: [['mini', 'mega']]
    }
  },
  allowed_plan: {
    type: DataTypes.STRING,
    defaultValue: '1month',
    validate: {
      isIn: [['1month', '3months', '6months']]
    }
  }
}, {
  timestamps: true,
  tableName: 'courses',
});

module.exports = Course;
