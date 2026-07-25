import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Read token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Access token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stock_market_simulator_jwt_secret_token_987654321');
    
    req.user = await User.findById(decoded.id).select('-password').lean();
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: User profile not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned or disabled'
      });
    }

    next();
  } catch (error) {
    console.error('JWT protection validation error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Access token validation failed'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stock_market_simulator_jwt_secret_token_987654321');
    req.user = await User.findById(decoded.id).select('-password').lean();
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${roles.join(', ')}]`
      });
    }
    next();
  };
};
