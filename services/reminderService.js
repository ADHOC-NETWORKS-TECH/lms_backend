const cron = require('node-cron');
const { Subscription, User, Course } = require('../models/associations');
const { Op } = require('sequelize');
const emailService = require('./emailService');

// Check and send reminders
const checkExpiringSubscriptions = async () => {
  console.log('🕐 Running expiry check...');
  
  const today = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  
  const oneDayLater = new Date();
  oneDayLater.setDate(oneDayLater.getDate() + 1);
  
  // 7-day reminders
  const expiring7Days = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: { [Op.between]: [sevenDaysLater, sevenDaysLater] }
    },
    include: [{ model: User, as: 'user' }, { model: Course, as: 'course' }]
  });
  
  // 1-day reminders
  const expiring1Day = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: { [Op.between]: [oneDayLater, oneDayLater] }
    },
    include: [{ model: User, as: 'user' }, { model: Course, as: 'course' }]
  });
  
  for (const sub of expiring7Days) {
    await emailService.sendReminder(sub.user, sub.course, 7);
  }
  
  for (const sub of expiring1Day) {
    await emailService.sendReminder(sub.user, sub.course, 1);
  }
  
  // Update expired subscriptions
  const [updatedCount] = await Subscription.update(
    { status: 'expired' },
    { where: { status: 'active', endDate: { [Op.lt]: new Date() } } }
  );
  
  console.log(`✅ Sent ${expiring7Days.length + expiring1Day.length} reminders, expired ${updatedCount} subscriptions`);
};

// Start cron job (runs daily at midnight)
const startReminderCron = () => {
  cron.schedule('0 0 * * *', async () => {
    await checkExpiringSubscriptions();
  });
  console.log('⏰ Reminder cron job scheduled');
};

module.exports = { startReminderCron, checkExpiringSubscriptions };