const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const { syncDatabase } = require('./models/index');
const { startExpiryCron } = require('./services/cronService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const emailRoutes = require('./routes/emailRoutes');
const mockPaymentRoutes = require('./routes/mockPaymentRoutes'); //mock paytment
const certificateRoutes = require('./routes/certificateRoutes');
const quizRoutes = require('./routes/quizRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', mockPaymentRoutes);//payment
app.use('/api/email', emailRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/quizzes', quizRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'LMS Backend is running! (Udemy Style - Custom Prices Per Course)',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      'my-courses': '/api/courses/my-courses',
      admin: '/api/admin',
      progress: '/api/progress',
      subscriptions: '/api/subscriptions'
    }
  });
});

// Sync database and start server
const startServer = async () => {
  try {
    await syncDatabase();
    
    // Start cron job for auto-expiry
    startExpiryCron();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Courses API: http://localhost:${PORT}/api/courses`);
      console.log(`💳 Subscriptions API: http://localhost:${PORT}/api/subscriptions`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};


startServer();