const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User } = require('../models/associations');
const { Op } = require('sequelize');

// Change Password (Logged in user)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'This email is not registered in our database. Please register first.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpiry
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email (using Resend or Nodemailer)
    const emailService = require('../services/emailService');
    const emailResult = await emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email. Please check server logs.',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'If your email is registered, you will receive a reset link'
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset Password - Set new password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Find user by token and check if not expired
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Verify reset token (check if valid)
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
