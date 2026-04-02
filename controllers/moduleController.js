const { Module, Lesson, Course } = require('../models/associations');

// Get modules for a course (protected - requires access check)
exports.getCourseModules = async (req, res) => {
  try {
    // Get courseId from params (this is set by the route: /:id/modules)
    const courseId = req.params.id;
    
    console.log(`📚 Getting modules for course: ${courseId}`);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Verify course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get modules with lessons
    const modules = await Module.findAll({
      where: { courseId: courseId },
      include: [
        {
          model: Lesson,
          as: 'lessons',
          order: [['order', 'ASC']]
        }
      ],
      order: [['order', 'ASC']]
    });

    console.log(`   Found ${modules.length} modules`);

    res.json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error('Get course modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Add module to course
exports.addModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, order } = req.body;

    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Module title is required'
      });
    }

    const module = await Module.create({
      courseId,
      title,
      order: order || 0
    });

    res.status(201).json({
      success: true,
      message: 'Module added successfully',
      data: module
    });
  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Update module
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    const { title, order } = req.body;

    await module.update({
      title: title || module.title,
      order: order !== undefined ? order : module.order
    });

    res.json({
      success: true,
      message: 'Module updated successfully',
      data: module
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Delete module
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    await module.destroy();

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};