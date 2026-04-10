const { Subscription, User, Course } = require('../models/associations');
const emailService = require('../services/emailService');

// Test sending email manually
exports.testSendEmail = async (req, res) => {
  try {
    const { email, type, subscriptionId } = req.body;
    
    console.log('📧 Test email request:', { email, type, subscriptionId });
    
    let user, course, subscription;
    
    if (subscriptionId) {
      subscription = await Subscription.findByPk(subscriptionId, {
        include: [
          { model: User, as: 'user' },
          { model: Course, as: 'course' }
        ]
      });
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found'
        });
      }
      
      user = subscription.user;
      course = subscription.course;
    } else if (email) {
      user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      subscription = await Subscription.findOne({
        where: { userId: user.id, status: 'active' },
        include: [{ model: Course, as: 'course' }]
      });
      
      if (subscription) {
        course = subscription.course;
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let result;
    
    switch(type) {
      case 'welcome':
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: 'Subscription ID required for welcome email'
          });
        }
        result = await emailService.sendWelcomeEmail(user, course, subscription);
        break;
      case '7days':
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: 'Subscription ID required for reminder email'
          });
        }
        result = await emailService.send7DayReminder(user, course, subscription);
        break;
      case '1day':
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: 'Subscription ID required for reminder email'
          });
        }
        result = await emailService.send1DayReminder(user, course, subscription);
        break;
      case 'expired':
        if (!course) {
          return res.status(400).json({
            success: false,
            message: 'Course required for expired notification'
          });
        }
        result = await emailService.sendExpiredNotification(user, course);
        break;
      case 'renewal':
        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: 'Subscription ID required for renewal email'
          });
        }
        result = await emailService.sendRenewalConfirmation(user, course, subscription);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use: welcome, 7days, 1day, expired, renewal'
        });
    }
    
    res.json({
      success: true,
      message: `Test ${type} email sent`,
      result
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

// Manually trigger expiry check
exports.triggerExpiryCheck = async (req, res) => {
  try {
    const { runExpiryTasks } = require('../services/cronService');
    await runExpiryTasks();
    res.json({
      success: true,
      message: 'Expiry check triggered manually'
    });
  } catch (error) {
    console.error('Trigger expiry check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger expiry check',
      error: error.message
    });
  }
};