const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('='.repeat(50));
      console.log('📧 [MOCK] Email would be sent to:', to);
      console.log('   Subject:', subject);
      console.log('   Content Preview:', html?.substring(0, 200) + '...');
      console.log('='.repeat(50));
      return { success: true, mock: true };
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log(`📧 Email sent to ${to} successfully. ID: ${data.id}`);
    return { success: true, data };
  } catch (err) {
    console.error('Email sending failed:', err);
    return { success: false, error: err.message };
  }
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

// Add this function to emailService.js
exports.sendPasswordResetEmail = async (email, name, resetUrl) => {
  const subject = 'Reset Your Password - LMS Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password for your LMS Portal account.</p>
      <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this, please ignore this email.</p>
      <br>
      <p>Team LMS Portal</p>
    </div>
  `;
  
  return await sendEmail(email, subject, html);
};