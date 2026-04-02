const { Progress, Lesson, Course, Module } = require('../models/associations');

// Mark lesson as complete
exports.markLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    // Check if lesson exists
    const lesson = await Lesson.findByPk(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if already completed
    const existingProgress = await Progress.findOne({
      where: { userId, lessonId }
    });

    if (existingProgress) {
      // If already completed, update timestamp
      await existingProgress.update({
        completed: true,
        completedAt: new Date()
      });
      
      return res.json({
        success: true,
        message: 'Lesson already marked as complete',
        data: existingProgress
      });
    }

    // Create new progress record
    const progress = await Progress.create({
      userId,
      lessonId,
      completed: true,
      completedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Lesson marked as complete',
      data: progress
    });
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Unmark lesson (mark as incomplete)
exports.unmarkLessonComplete = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.findOne({
      where: { userId, lessonId }
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress not found'
      });
    }

    await progress.update({
      completed: false,
      completedAt: null
    });

    res.json({
      success: true,
      message: 'Lesson marked as incomplete'
    });
  } catch (error) {
    console.error('Unmark lesson error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get progress for a specific course
exports.getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Get all lessons in the course
    const lessons = await Lesson.findAll({
      include: [
        {
          model: Module,
          as: 'module',
          where: { courseId },
          attributes: ['id', 'title', 'order']
        }
      ],
      attributes: ['id', 'title', 'order', 'duration']
    });

    // Get user's progress
    const progress = await Progress.findAll({
      where: { userId },
      attributes: ['lessonId', 'completed', 'completedAt']
    });

    // Create progress map
    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.lessonId] = {
        completed: p.completed,
        completedAt: p.completedAt
      };
    });

    // Calculate overall progress
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(lesson => 
      progressMap[lesson.id]?.completed === true
    ).length;

    const percentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Format lessons with progress status
    const lessonsWithProgress = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      duration: lesson.duration,
      moduleId: lesson.module.id,
      moduleTitle: lesson.module.title,
      completed: progressMap[lesson.id]?.completed || false,
      completedAt: progressMap[lesson.id]?.completedAt || null
    }));

    res.json({
      success: true,
      data: {
        courseId: parseInt(courseId),
        totalLessons,
        completedLessons,
        percentage,
        lessons: lessonsWithProgress
      }
    });
  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get overall progress for all courses (for dashboard)
exports.getOverallProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all courses with lessons
    const courses = await Course.findAll({
      include: [
        {
          model: Module,
          as: 'modules',
          include: [
            {
              model: Lesson,
              as: 'lessons'
            }
          ]
        }
      ]
    });

    // Get all user progress
    const progress = await Progress.findAll({
      where: { userId }
    });

    const progressMap = {};
    progress.forEach(p => {
      progressMap[p.lessonId] = p.completed;
    });

    // Calculate progress per course
    const coursesWithProgress = courses.map(course => {
      let totalLessons = 0;
      let completedLessons = 0;

      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          totalLessons++;
          if (progressMap[lesson.id]) {
            completedLessons++;
          }
        });
      });

      const percentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        totalLessons,
        completedLessons,
        progress: percentage
      };
    });

    res.json({
      success: true,
      data: coursesWithProgress
    });
  } catch (error) {
    console.error('Get overall progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};