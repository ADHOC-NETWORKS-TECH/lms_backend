const { User, Subscription, Course } = require('../models/associations');
const { Op } = require('sequelize');

exports.getAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching analytics...');
    
    // Get total students
    const totalStudents = await User.count({ where: { role: 'student' } });
    console.log('Total students:', totalStudents);
    
    // Get total courses
    const totalCourses = await Course.count();
    console.log('Total courses:', totalCourses);
    
    // Get active subscriptions
    const activeSubscriptions = await Subscription.count({
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    console.log('Active subscriptions:', activeSubscriptions);
    
    // Get total revenue
    const revenueResult = await Subscription.sum('amount', {
      where: {
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });
    const totalRevenue = revenueResult || 0;
    console.log('Total revenue:', totalRevenue);
    
    // Simple monthly revenue (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const monthlyRevenue = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      monthlyRevenue.push({
        month: months[monthIndex],
        revenue: 0
      });
    }
    
    // Simple new users data
    const newUsers = monthlyRevenue.map(m => ({ month: m.month, users: 0 }));
    
    // Get popular courses
    const subscriptions = await Subscription.findAll({
      where: { status: 'active' },
      attributes: ['courseId'],
      include: [{ model: Course, as: 'course', attributes: ['id', 'title'] }],
      limit: 100
    });
    
    const courseCount = {};
    for (const sub of subscriptions) {
      const courseId = sub.courseId;
      courseCount[courseId] = (courseCount[courseId] || 0) + 1;
    }
    
    const popularCourses = Object.entries(courseCount)
      .map(([courseId, count]) => ({
        courseId: parseInt(courseId),
        enrollmentCount: count,
        course: subscriptions.find(s => s.courseId == courseId)?.course || null
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 5);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalCourses,
          activeSubscriptions,
          totalRevenue
        },
        monthlyRevenue,
        newUsers,
        popularCourses,
        completionRate: 0
      }
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: error.stack
    });
  }
};