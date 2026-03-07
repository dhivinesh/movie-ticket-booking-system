const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware: Verify JWT token from Authorization header.
 * Attaches decoded payload to req.user
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is deactivated
    const [[user]] = await pool.query('SELECT is_active FROM users WHERE id = ?', [decoded.id]);
    if (!user || user.is_active === 0) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
    }

    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware factory: Restrict route to specific roles.
 * Usage: requireRole('admin') or requireRole('admin', 'theater_owner')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden. Insufficient permissions.' });
  }
  next();
};

module.exports = { verifyToken, requireRole };
