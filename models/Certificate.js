const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  certificateNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  verificationCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  issueDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  quizScore: { type: DataTypes.INTEGER, allowNull: false },
  pdfPath: { type: DataTypes.STRING },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { timestamps: true });

module.exports = Certificate;