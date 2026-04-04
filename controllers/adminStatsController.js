const { User, Subscription, Course } = require('../models/associations');
const { Op } = require('sequelize');

exports.getStats = async (req, res) => {
  try {
    console.log('📊 Fetching admin stats...');
    
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalCourses = await Course.count();
    
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    
    const revenueResult = await Subscription.sum('amount', {
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    
    const totalRevenue = revenueResult || 0;
    
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