const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Initialize Nodemailer transporter if user provides SMTP credentials
const transporter = process.env.SMTP_USER && process.env.SMTP_PASS ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

const sendEmail = async (to, subject, html) => {
  try {
    // 1. Try Nodemailer if configured (best for Gmail)
    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: to,
        subject: subject,
        html: html,
      });
      console.log(`📧 Email sent to ${to} successfully via Nodemailer. ID: ${info.messageId}`);
      return { success: true, data: info };
    }
    
    // 2. Try Resend if configured
    if (resend) {
      const { data, error } = await resend.emails.send({
        // For Resend Free Tier, you must use 'onboarding@resend.dev' unless you verify a domain.
        // Gmail addresses are strictly forbidden as the 'from' address in Resend.
        from: process.env.EMAIL_FROM && !process.env.EMAIL_FROM.includes('@gmail.com') ? process.env.EMAIL_FROM : 'onboarding@resend.dev',
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        console.error('❌ Error sending email via Resend:', error.message);
        return { success: false, error: error.message };
      }

      console.log(`📧 Email sent to ${to} successfully via Resend. ID: ${data.id}`);
      return { success: true, data };
    }

    // 3. Fallback to MOCK
    console.log('='.repeat(50));
    console.log('📧 [MOCK] Email would be sent to:', to);
    console.log('   Subject:', subject);
    console.log('   Content Preview:', html?.substring(0, 200) + '...');
    console.log('='.repeat(50));
    return { success: true, mock: true };

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