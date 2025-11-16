const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is admin or teacher
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.username !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only the admin account can access this resource.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is specifically admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (user.username !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only the admin account can access this resource.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = {
  requireAdmin,
  requireSuperAdmin
};