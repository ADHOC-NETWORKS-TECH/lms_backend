const { Subscription } = require('../models/associations');
const { Op } = require('sequelize');

// Check if user has active subscription
exports.checkSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this content',
        requireSubscription: true
      });
    }

    // Add subscription info to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check if user has active subscription (for optional content)
exports.hasActiveSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    req.hasSubscription = !!subscription;
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    req.hasSubscription = false;
    next();
  }
};