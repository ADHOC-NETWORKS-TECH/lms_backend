const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Subscription } = require('../models/associations');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'student', referralCode } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle Referral Code logic
    let referredById = null;
    if (referralCode) {
      const referrer = await User.findOne({ where: { referralCode } });
      if (referrer) {
        referredById = referrer.id;
        // Increment their available discounts
        await referrer.increment('availableDiscounts', { by: 1 });
      }
    }

    // Generate unique referral code for the new user
    const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      referralCode: newReferralCode,
      referredBy: referredById,
      availableDiscounts: referredById ? 1 : 0
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        availableDiscounts: user.availableDiscounts,
        coins: user.coins
      },
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Backfill referral code if missing for old users
    if (!user.referralCode) {
      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      user.referralCode = newReferralCode;
      await user.save();
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        availableDiscounts: user.availableDiscounts,
        coins: user.coins
      },
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get Current User Profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
