const cron = require('node-cron');
const { Subscription, User, Course } = require('../models/associations');
const { Op } = require('sequelize');
const emailService = require('./emailService');

// Check and send reminders for subscriptions expiring soon
const checkExpiringSubscriptions = async () => {
  console.log('🕐 Running expiry check...', new Date().toISOString());
  
  try {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const oneDayLater = new Date();
    oneDayLater.setDate(oneDayLater.getDate() + 1);

    // Find subscriptions expiring in 7 days
    const expiring7Days = await Subscription.findAll({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [sevenDaysLater, sevenDaysLater]
        }
      },
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'course' }
      ]
    });

    // Find subscriptions expiring in 1 day
    const expiring1Day = await Subscription.findAll({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [oneDayLater, oneDayLater]
        }
      },
      include: [
        { model: User, as: 'user' },
        { model: Course, as: 'course' }
      ]
    });

    // Send 7-day reminders
    for (const sub of expiring7Days) {
      console.log(`📧 Sending 7-day reminder to ${sub.user.email} for ${sub.course.title}`);
      await emailService.send7DayReminder(sub.user, sub.course, sub);
      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Send 1-day reminders
    for (const sub of expiring1Day) {
      console.log(`📧 Sending 1-day reminder to ${sub.user.email} for ${sub.course.title}`);
      await emailService.send1DayReminder(sub.user, sub.course, sub);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Expiry check complete. Sent ${expiring7Days.length} 7-day reminders, ${expiring1Day.length} 1-day reminders`);
  } catch (error) {
    console.error('❌ Expiry check error:', error);
  }
};

// Update expired subscriptions
const updateExpiredSubscriptions = async () => {
  console.log('🕐 Updating expired subscriptions...', new Date().toISOString());
  
  try {
    // Find and update expired subscriptions
    const [updatedCount] = await Subscription.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          endDate: { [Op.lt]: new Date() }
        }
      }
    );

    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} expired subscriptions`);
      
      // Get expired subscriptions to send notifications
      const expiredSubs = await Subscription.findAll({
        where: {
          status: 'expired',
          updatedAt: { [Op.gte]: new Date(Date.now() - 60000) } // Last minute
        },
        include: [
          { model: User, as: 'user' },
          { model: Course, as: 'course' }
        ]
      });

      // Send expiry notifications
      for (const sub of expiredSubs) {
        console.log(`📧 Sending expiry notification to ${sub.user.email} for ${sub.course.title}`);
        await emailService.sendExpiredNotification(sub.user, sub.course);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log('✅ No expired subscriptions found');
    }
  } catch (error) {
    console.error('❌ Update expired subscriptions error:', error);
  }
};

// Run both tasks
const runExpiryTasks = async () => {
  await checkExpiringSubscriptions();
  await updateExpiredSubscriptions();
};

// Start cron job (runs every day at midnight)
const startExpiryCron = () => {
  // Run at midnight every day
  cron.schedule('0 0 * * *', async () => {
    console.log('=' .repeat(50));
    console.log('🕐 CRON JOB STARTED - Daily Expiry Check');
    console.log('=' .repeat(50));
    await runExpiryTasks();
    console.log('=' .repeat(50));
    console.log('✅ CRON JOB COMPLETED');
    console.log('=' .repeat(50));
  });
  
  console.log('⏰ Cron job scheduled for midnight daily');
  
  // Optional: Run immediately for testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Development mode: Running expiry check now...');
    setTimeout(runExpiryTasks, 5000);
  }
};

module.exports = { startExpiryCron, runExpiryTasks };