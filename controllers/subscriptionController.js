const { Subscription, User, Course } = require('../models/associations');
const { Op } = require('sequelize');

// Plan durations (in days)
const PLANS = {
  '1month': { name: '1 Month Access', duration: 30 },
  '3months': { name: '3 Months Access', duration: 90 },
  '6months': { name: '6 Months Access', duration: 180 }
};

// Get available plans for a specific course with CUSTOM prices from course table
exports.getPlansForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Get prices directly from the course record
    const plansWithPrice = {
      '1month': {
        ...PLANS['1month'],
        price: course.price_1month || 499
      },
      '3months': {
        ...PLANS['3months'],
        price: course.price_3months || 1299
      },
      '6months': {
        ...PLANS['6months'],
        price: course.price_6months || 2499
      }
    };
    
    res.json({
      success: true,
      data: {
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail
        },
        plans: plansWithPrice
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create subscription for a specific course
exports.createSubscription = async (req, res) => {
  try {
    const { courseId, plan, paymentId } = req.body;
    
    // DEBUG: Log the request
    console.log('📝 Create Subscription Request:');
    console.log('   req.user:', req.user);
    console.log('   req.body:', req.body);

    // Validate user exists
    if (!req.user || !req.user.id) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    console.log(`   User ID: ${userId}`);

    // Verify user exists in database
    const User = require('../models/User');
    const userExists = await User.findByPk(userId);
    
    if (!userExists) {
      console.log(`❌ User with ID ${userId} does not exist in database`);
      return res.status(400).json({
        success: false,
        message: 'Invalid user. Please login again.'
      });
    }
    console.log(`✅ User found: ${userExists.email}`);

    // Validate course exists
    const Course = require('../models/Course');
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    console.log(`✅ Course found: ${course.title}`);

    // Validate plan
    const PLANS = {
      '1month': { name: '1 Month Access', duration: 30 },
      '3months': { name: '3 Months Access', duration: 90 },
      '6months': { name: '6 Months Access', duration: 180 }
    };

    if (!PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    // Get the price for this plan from the course
    let price;
    switch(plan) {
      case '1month':
        price = course.price_1month;
        break;
      case '3months':
        price = course.price_3months;
        break;
      case '6months':
        price = course.price_6months;
        break;
      default:
        price = 499;
    }
    console.log(`   Plan: ${plan}, Price: ${price}`);

    // Check if user already has active subscription for this course
    const { Subscription } = require('../models/associations');
    const { Op } = require('sequelize');

    const existingSubscription = await Subscription.findOne({
      where: {
        userId: userId,
        courseId: courseId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription for this course',
        data: {
          id: existingSubscription.id,
          plan: existingSubscription.plan,
          expiresAt: existingSubscription.endDate,
          daysRemaining: Math.ceil((new Date(existingSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + PLANS[plan].duration);
    console.log(`   Start: ${startDate}, End: ${endDate}`);

    // Create subscription
    const subscription = await Subscription.create({
      userId: userId,
      courseId: courseId,
      plan: plan,
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      amount: price
    });

    console.log(`✅ Subscription created with ID: ${subscription.id}`);

    res.status(201).json({
      success: true,
      message: 'Course purchased successfully',
      data: {
        id: subscription.id,
        courseId: subscription.courseId,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        amount: subscription.amount,
        daysRemaining: PLANS[plan].duration,
        course: {
          id: course.id,
          title: course.title
        }
      }
    });
  } catch (error) {
    console.error('❌ Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's active subscriptions (all courses they have access to)
exports.getMySubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'thumbnail']
        }
      ],
      order: [['endDate', 'ASC']]
    });

    const subscriptionsWithDetails = subscriptions.map(sub => ({
      id: sub.id,
      courseId: sub.courseId,
      course: sub.course,
      plan: sub.plan,
      startDate: sub.startDate,
      endDate: sub.endDate,
      amount: sub.amount,
      status: sub.status,
      daysRemaining: Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptionsWithDetails
    });
  } catch (error) {
    console.error('Get my subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


// Check if user has access to a specific course
exports.checkCourseAccess = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`Checking access for User ${userId} on Course ${courseId}`);

    // First, check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find subscription WITHOUT include first (to avoid association errors)
    const subscription = await Subscription.findOne({
      where: {
        userId: userId,
        courseId: courseId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (subscription) {
      console.log(`✅ Access granted. Subscription found:`, subscription.id);
      res.json({
        success: true,
        hasAccess: true,
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          expiresAt: subscription.endDate,
          daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
          amount: subscription.amount,
          courseId: subscription.courseId
        },
        course: {
          id: course.id,
          title: course.title,
          prices: {
            '1month': course.price_1month,
            '3months': course.price_3months,
            '6months': course.price_6months
          }
        }
      });
    } else {
      console.log(`❌ No access. No active subscription found`);
      res.json({
        success: true,
        hasAccess: false,
        course: {
          id: course.id,
          title: course.title,
          prices: {
            '1month': course.price_1month,
            '3months': course.price_3months,
            '6months': course.price_6months
          }
        }
      });
    }
  } catch (error) {
    console.error('Check course access error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subscription history for a specific course
exports.getCourseSubscriptionHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        courseId
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get course subscription history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Get all subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get all subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Get expiring subscriptions (next 7 days)
exports.getExpiringSubscriptions = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const subscriptions = await Subscription.findAll({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [today, nextWeek]
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        }
      ],
      order: [['endDate', 'ASC']]
    });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get expiring subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Manually extend subscription
exports.extendSubscription = async (req, res) => {
  try {
    const { subscriptionId, days } = req.body;

    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    await subscription.update({
      endDate: newEndDate,
      status: 'active'
    });

    res.json({
      success: true,
      message: `Subscription extended by ${days} days`,
      data: {
        id: subscription.id,
        userId: subscription.userId,
        courseId: subscription.courseId,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: newEndDate,
        amount: subscription.amount
      }
    });
  } catch (error) {
    console.error('Extend subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};