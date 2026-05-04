const sequelize = require('../config/database');
const associations = require('./associations');

const syncDatabase = async () => {
  try {
    // Force sync to recreate tables with correct associations
    await sequelize.sync({ force: true });
      } catch (error) {
      }
};

module.exports = {
  ...associations,
  syncDatabase,
};
