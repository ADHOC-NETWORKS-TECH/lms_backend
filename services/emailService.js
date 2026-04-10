// Simple email service (mock mode for development)

const sendEmail = async (to, subject, html) => {
  console.log('='.repeat(50));
  console.log('📧 [MOCK] Email would be sent to:', to);
  console.log('   Subject:', subject);
  console.log('   Content Preview:', html?.substring(0, 200) + '...');
  console.log('='.repeat(50));
  return { success: true, mock: true };
};

exports.sendWelcomeEmail = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const subject = `Welcome to ${course.title}! 🎉`;
  const html = `<h2>Hi ${user.name},</h2><p>Thank you for purchasing ${course.title}!</p>`;
  return await sendEmail(user.email, subject, html);
};

exports.send7DayReminder = async (user, course, subscription) => {
  const subject = `⚠️ Your access to ${course.title} expires in 7 days`;
  const html = `<h2>Hi ${user.name},</h2><p>Your access to ${course.title} expires in 7 days!</p>`;
  return await sendEmail(user.email, subject, html);
};

exports.send1DayReminder = async (user, course, subscription) => {
  const subject = `🚨 URGENT: Your ${course.title} access expires TOMORROW!`;
  const html = `<h2>Hi ${user.name},</h2><p>Your access to ${course.title} expires TOMORROW!</p>`;
  return await sendEmail(user.email, subject, html);
};

exports.sendExpiredNotification = async (user, course) => {
  const subject = `Your ${course.title} access has expired`;
  const html = `<h2>Hi ${user.name},</h2><p>Your access to ${course.title} has expired.</p>`;
  return await sendEmail(user.email, subject, html);
};

exports.sendRenewalConfirmation = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const subject = `✅ ${course.title} renewed successfully!`;
  const html = `<h2>Hi ${user.name},</h2><p>Your ${course.title} access has been renewed!</p>`;
  return await sendEmail(user.email, subject, html);
};