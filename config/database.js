const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Connect to Supabase PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false  // Required for Supabase
    }
  },
  logging: false  // Set to true to see SQL queries
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully to Supabase!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

testConnection();

module.exports = sequelize;