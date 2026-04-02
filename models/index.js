const sequelize = require('../config/database');
const associations = require('./associations');

const syncDatabase = async () => {
  try {
    // Force sync to recreate tables with correct associations
    await sequelize.sync({ force: true });
    console.log('✅ Database tables recreated successfully!');
  } catch (error) {
    console.error('❌ Database sync failed:', error.message);
  }
};

module.exports = {
  ...associations,
  syncDatabase,
};