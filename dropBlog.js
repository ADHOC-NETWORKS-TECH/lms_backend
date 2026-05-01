const sequelize = require('./config/database');
const Blog = require('./models/Blog');

async function dropBlogTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    
    // Check if the table exists and drop it
    await sequelize.query('DROP TABLE IF EXISTS "blogs" CASCADE;');
    console.log('Dropped blogs table successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error dropping table:', error);
    process.exit(1);
  }
}

dropBlogTable();
