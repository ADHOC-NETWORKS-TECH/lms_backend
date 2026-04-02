const { User, Subscription, Course, Progress } = require('../models/associations');
const { Op } = require('sequelize');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin stats...');
    
    // Total users (students only - count all users with role 'student')
    const totalStudents = await User.count({ 
      where: { role: 'student' } 
    });
    
    const totalAdmins = await User.count({ 
      where: { role: 'admin' } 
    });
    
    // Total courses
    const totalCourses = await Course.count();
    
    // Active subscriptions (not expired)
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    
    // Total revenue (sum of all active subscription amounts)
    const revenueResult = await Subscription.sum('amount', {
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    
    const totalRevenue = revenueResult || 0;
    
    console.log('📊 Stats result:', {
      totalStudents,
      totalAdmins,
      totalCourses,
      activeSubscriptions,
      totalRevenue
    });
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalStudents + totalAdmins,
          students: totalStudents,
          admins: totalAdmins
        },
        subscriptions: {
          active: activeSubscriptions
        },
        content: {
          courses: totalCourses
        },
        revenue: {
          total: totalRevenue,
          currency: 'INR'
        }
      }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};