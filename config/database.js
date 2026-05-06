const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  // Connection via URL (like Supabase or some Hostinger setups)
  const isPostgres = databaseUrl.startsWith('postgres');
  sequelize = new Sequelize(databaseUrl, {
    dialect: isPostgres ? 'postgres' : 'mysql',
    dialectOptions: isPostgres ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Connection via individual parameters (Standard Hostinger MySQL)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
      } catch (error) {
      }
};

testConnection();

module.exports = sequelize;
