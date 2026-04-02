// Simple email service (mock mode for development)

// Email templates
const templates = {
  welcome: (userName, courseTitle, expiryDate, daysRemaining) => ({
    subject: `Welcome to ${courseTitle}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Thank you for purchasing <strong>${courseTitle}</strong>!</p>
        <p>Your access will expire on: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
        <p>Days remaining: <strong>${daysRemaining} days</strong></p>
        <p>Start learning now!</p>
        <br>
        <p>Happy Learning!</p>
        <p>Team LMS</p>
      </div>
    `
  }),

  reminder7Days: (userName, courseTitle, expiryDate, daysRemaining) => ({
    subject: `⚠️ Your access to ${courseTitle} expires in 7 days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Your access to <strong>${courseTitle}</strong> will expire in <strong>7 days</strong>!</p>
        <p>Expiry Date: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
        <p>Renew now to continue learning.</p>
        <br>
        <p>Team LMS</p>
      </div>
    `
  }),

  reminder1Day: (userName, courseTitle, expiryDate, daysRemaining) => ({
    subject: `🚨 URGENT: Your ${courseTitle} access expires TOMORROW!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>⚠️ <strong>URGENT:</strong> Your access to <strong>${courseTitle}</strong> expires <strong>TOMORROW</strong>!</p>
        <p>Expiry Date: <strong>${new Date(expiryDate).toLocaleDateString()}</strong></p>
        <p>Renew now to continue your learning journey.</p>
        <br>
        <p>Team LMS</p>
      </div>
    `
  }),

  expired: (userName, courseTitle, purchaseUrl) => ({
    subject: `Your ${courseTitle} access has expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Your access to <strong>${courseTitle}</strong> has now expired.</p>
        <p>Your progress has been saved! When you purchase again, you can resume from where you left off.</p>
        <br>
        <p>Team LMS</p>
      </div>
    `
  }),

  renewal: (userName, courseTitle, newExpiryDate, daysRemaining) => ({
    subject: `✅ ${courseTitle} renewed successfully!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${userName},</h2>
        <p>Your access to <strong>${courseTitle}</strong> has been renewed!</p>
        <p>New expiry date: <strong>${new Date(newExpiryDate).toLocaleDateString()}</strong></p>
        <p>Days remaining: <strong>${daysRemaining} days</strong></p>
        <br>
        <p>Happy Learning!</p>
        <p>Team LMS</p>
      </div>
    `
  })
};

// Send email (mock mode for development)
const sendEmail = async (to, subject, html) => {
  console.log('=' .repeat(50));
  console.log('📧 [MOCK] Email would be sent to:', to);
  console.log('   Subject:', subject);
  console.log('   Content Preview:', html.substring(0, 200) + '...');
  console.log('=' .repeat(50));
  
  return { success: true, mock: true };
};

// Send welcome email after purchase
exports.sendWelcomeEmail = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const template = templates.welcome(user.name, course.title, subscription.endDate, daysRemaining);
  return await sendEmail(user.email, template.subject, template.html);
};

// Send expiry reminder (7 days before)
exports.send7DayReminder = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const template = templates.reminder7Days(user.name, course.title, subscription.endDate, daysRemaining);
  return await sendEmail(user.email, template.subject, template.html);
};

// Send expiry reminder (1 day before)
exports.send1DayReminder = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const template = templates.reminder1Day(user.name, course.title, subscription.endDate, daysRemaining);
  return await sendEmail(user.email, template.subject, template.html);
};

// Send expired notification
exports.sendExpiredNotification = async (user, course) => {
  const purchaseUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${course.id}/purchase`;
  const template = templates.expired(user.name, course.title, purchaseUrl);
  return await sendEmail(user.email, template.subject, template.html);
};

// Send renewal confirmation
exports.sendRenewalConfirmation = async (user, course, subscription) => {
  const daysRemaining = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const template = templates.renewal(user.name, course.title, subscription.endDate, daysRemaining);
  return await sendEmail(user.email, template.subject, template.html);
};