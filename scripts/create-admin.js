const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const { User } = require('../models/associations');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    
    const [admin, created] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        name: 'Super Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin'
      }
    });
    
    if (created) {
      console.log('✅ Admin created!');
    } else {
      console.log('✅ Admin already exists!');
    }
    
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();