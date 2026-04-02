const { Lesson, Module, Course, Subscription } = require('../models/associations');
const { Op } = require('sequelize');

// Admin: Add lesson to module
exports.addLesson = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, videoUrl, pdfUrl, order, duration } = req.body;

    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Lesson title and video URL are required'
      });
    }

    const lesson = await Lesson.create({
      moduleId,
      title,
      videoUrl,
      pdfUrl: pdfUrl || null,
      order: order || 0,
      duration: duration || 0
    });

    res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Update lesson
exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const { title, videoUrl, pdfUrl, order, duration } = req.body;

    await lesson.update({
      title: title || lesson.title,
      videoUrl: videoUrl || lesson.videoUrl,
      pdfUrl: pdfUrl !== undefined ? pdfUrl : lesson.pdfUrl,
      order: order !== undefined ? order : lesson.order,
      duration: duration !== undefined ? duration : lesson.duration
    });

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Delete lesson
exports.deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    await lesson.destroy();

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get lesson by ID (requires course access)
exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id, {
      include: [
        {
          model: Module,
          as: 'module',
          include: [
            {
              model: Course,
              as: 'course'
            }
          ]
        }
      ]
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    if (!lesson.module || !lesson.module.course) {
      return res.status(404).json({
        success: false,
        message: 'Lesson structure is invalid'
      });
    }

    const courseId = lesson.module.course.id;

    // Check if user has access to this course
    const subscription = await Subscription.findOne({
      where: {
        userId: req.user.id,
        courseId: courseId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this course to access lessons',
        requirePurchase: true,
        courseId: courseId,
        courseTitle: lesson.module.course.title,
        purchaseUrl: `/api/subscriptions/course/${courseId}/plans`
      });
    }

    res.json({
      success: true,
      data: {
        id: lesson.id,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        pdfUrl: lesson.pdfUrl,
        order: lesson.order,
        duration: lesson.duration,
        moduleId: lesson.moduleId,
        courseAccess: {
          hasAccess: true,
          expiresAt: subscription.endDate,
          daysRemaining: Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
          plan: subscription.plan
        }
      }
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};