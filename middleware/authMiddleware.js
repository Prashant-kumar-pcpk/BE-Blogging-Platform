const User = require('../models/User');
const { verifyAuthToken } = require('../utils/auth');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing.'
      });
    }

    const decoded = verifyAuthToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    req.user = user;
    req.authToken = token;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = authMiddleware;
