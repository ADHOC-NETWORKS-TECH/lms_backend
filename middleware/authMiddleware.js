const jwt = require('jsonwebtoken');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  console.log('🔐 Auth Debug: Headers received:', JSON.stringify(req.headers, null, 2));

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('🔐 Auth Debug: Token found:', token.substring(0, 30) + '...');
  } else {
    console.log('🔐 Auth Debug: No authorization header or wrong format');
  }

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ User authenticated:', { 
      id: req.user.id, 
      email: req.user.email, 
      role: req.user.role 
    });
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
};