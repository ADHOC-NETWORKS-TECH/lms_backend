const { User, Subscription, Course, Progress, QuizAttempt } = require('../models/associations');
const { Op } = require('sequelize');

// Get dashboard analytics
exports.getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    // Revenue by month (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const revenue = await Subscription.sum('amount', {
        where: {
          status: 'active',
          createdAt: { [Op.between]: [monthStart, monthEnd] }
        }
      });
      
      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: revenue || 0
      });
    }
    
    // New users by month
    const newUsers = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await User.count({
        where: { createdAt: { [Op.between]: [monthStart, monthEnd] } }
      });
      
      newUsers.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        users: count
      });
    }
    
    // Popular courses
    const popularCourses = await Subscription.findAll({
      attributes: ['courseId', [Sequelize.fn('COUNT', Sequelize.col('courseId')), 'enrollmentCount']],
      group: ['courseId'],
      include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
      order: [[Sequelize.fn('COUNT', Sequelize.col('courseId')), 'DESC']],
      limit: 5
    });
    
    // Completion rate
    const totalEnrollments = await Subscription.count({ where: { status: 'active' } });
    const completedCourses = await Progress.count({
      where: { completed: true },
      group: ['userId', 'courseId']
    });
    
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedCourses.length / totalEnrollments) * 100) 
      : 0;
    
    res.json({
      success: true,
      data: {
        monthlyRevenue,
        newUsers,
        popularCourses,
        completionRate
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};