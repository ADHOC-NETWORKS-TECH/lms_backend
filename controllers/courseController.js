const { Course, Module, Lesson, Subscription,Quiz  } = require('../models/associations');
const { Op } = require('sequelize');

// Get all courses (public)
exports.getAllCourses = async (req, res) => {
  try {
    // Get ALL courses regardless of login status
    const courses = await Course.findAll({
      attributes: ['id', 'title', 'description', 'thumbnail', 'price_1month', 'price_3months', 'price_6months'],
      order: [['createdAt', 'DESC']]
    });

    // If user is logged in, add access status
    let userAccess = {};
    if (req.user) {
      const subscriptions = await Subscription.findAll({
        where: {
          userId: req.user.id,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        }
      });
      
      userAccess = subscriptions.reduce((acc, sub) => {
        acc[sub.courseId] = {
          hasAccess: true,
          expiresAt: sub.endDate,
          plan: sub.plan
        };
        return acc;
      }, {});
    }

    // Return ALL courses with access status
    const coursesWithAccess = courses.map(course => ({
      ...course.toJSON(),
      userAccess: userAccess[course.id] || { hasAccess: false }
    }));

    res.json({
      success: true,
      count: coursesWithAccess.length,
      data: coursesWithAccess
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single course with modules and lessons
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Module,
          as: 'modules',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              order: [['order', 'ASC']]
            }
          ],
          order: [['order', 'ASC']]
        },
         {
          model: Quiz,        // ← ADD THIS
          as: 'quizzes'       // ← ADD THIS
        }
      ]
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // FIX: Check if req.user exists before accessing
    let hasAccess = false;
    let accessInfo = null;

    if (req.user && req.user.id) {
      const subscription = await Subscription.findOne({
        where: {
          userId: req.user.id,
          courseId: course.id,
          status: 'active',
          endDate: { [Op.gt]: new Date() }
        }
      });

      hasAccess = !!subscription;
      if (hasAccess) {
        accessInfo = {
          plan: subscription.plan,
          expiresAt: subscription.endDate,
          daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
          purchasedAt: subscription.createdAt,
          amount: subscription.amount
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        prices: {
          '1month': course.price_1month,
          '3months': course.price_3months,
          '6months': course.price_6months
        },
        modules: course.modules || [],
        userAccess: {
          hasAccess,
          ...accessInfo
        }
      }
    });
  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get courses user has purchased (My Courses)
exports.getMyCourses = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const userId = req.user.id;
    console.log(`Getting purchased courses for user: ${userId}`);

    // Get subscriptions WITHOUT include first
    const subscriptions = await Subscription.findAll({
      where: {
        userId: userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    console.log(`Found ${subscriptions.length} active subscriptions`);

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    // Manually fetch courses for each subscription
    const courses = [];
    for (const sub of subscriptions) {
      const course = await Course.findByPk(sub.courseId);
      if (course) {
        courses.push({
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          subscription: {
            id: sub.id,
            plan: sub.plan,
            expiresAt: sub.endDate,
            daysRemaining: Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
            purchasedAt: sub.createdAt,
            amount: sub.amount
          }
        });
      }
    }

    res.json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Create new course
exports.createCourse = async (req, res) => {
  try {
    const { title, description, thumbnail, price_1month, price_3months, price_6months } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Course title is required'
      });
    }

    const course = await Course.create({
      title,
      description: description || null,
      thumbnail: thumbnail || null,
      price_1month: price_1month || 499,
      price_3months: price_3months || 1299,
      price_6months: price_6months || 2499
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        prices: {
          '1month': course.price_1month,
          '3months': course.price_3months,
          '6months': course.price_6months
        }
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Update course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const { title, description, thumbnail, price_1month, price_3months, price_6months } = req.body;
    
    await course.update({
      title: title || course.title,
      description: description !== undefined ? description : course.description,
      thumbnail: thumbnail !== undefined ? thumbnail : course.thumbnail,
      price_1month: price_1month !== undefined ? price_1month : course.price_1month,
      price_3months: price_3months !== undefined ? price_3months : course.price_3months,
      price_6months: price_6months !== undefined ? price_6months : course.price_6months
    });
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        prices: {
          '1month': course.price_1month,
          '3months': course.price_3months,
          '6months': course.price_6months
        }
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    await course.destroy();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};