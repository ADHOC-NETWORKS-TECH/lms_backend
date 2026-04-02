const { Subscription } = require('../models/associations');
const { Op } = require('sequelize');

// Check if user has access to a specific course
exports.checkCourseAccess = async (req, res, next) => {
  try {
    // IMPORTANT: Get courseId from different possible locations
    let courseId = req.params.courseId || req.params.id;
    
    console.log('🔍 Course Access Check Debug:');
    console.log('   req.params:', req.params);
    console.log('   Extracted courseId:', courseId);
    console.log('   User ID:', req.user?.id);

    // If still no courseId, check the URL path
    if (!courseId) {
      const pathParts = req.path.split('/');
      // Look for a number in the path (course ID)
      for (const part of pathParts) {
        if (/^\d+$/.test(part)) {
          courseId = parseInt(part);
          break;
        }
      }
    }

    if (!courseId) {
      console.error('❌ No courseId found in request');
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Get course details
    const Course = require('../models/Course');
    const course = await Course.findByPk(courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check for active subscription
    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        courseId: courseId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    console.log('   Subscription found:', !!subscription);

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: `You need to purchase "${course.title}" to access this content`,
        requirePurchase: true,
        courseId: courseId,
        courseTitle: course.title,
        plans: {
          '1month': { price: course.price_1month, duration: '30 days' },
          '3months': { price: course.price_3months, duration: '90 days' },
          '6months': { price: course.price_6months, duration: '180 days' }
        },
        purchaseUrl: `/api/subscriptions/course/${courseId}/plans`
      });
    }

    // Add subscription info to request
    req.courseSubscription = {
      id: subscription.id,
      plan: subscription.plan,
      expiresAt: subscription.endDate,
      daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    };
    
    console.log('✅ Access granted');
    next();
  } catch (error) {
    console.error('❌ Course access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};