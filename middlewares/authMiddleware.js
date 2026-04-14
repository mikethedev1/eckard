const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { errorResponse } = require('../utils/response');

/**
 * Verify JWT from Authorization header or HTTP-only cookie
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Try cookie first
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }
    // 2. Fall back to Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB (ensures banned users are rejected)
    const [rows] = await pool.query(
      `SELECT id, uuid, email, first_name, last_name, role, status, balance
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [decoded.id]
    );

    if (!rows.length) {
      return errorResponse(res, 'User not found', 401);
    }

    const user = rows[0];

    if (user.status === 'banned') {
      return errorResponse(res, 'Your account has been suspended. Contact support.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token', 401);
  }
};

module.exports = { authenticate };
