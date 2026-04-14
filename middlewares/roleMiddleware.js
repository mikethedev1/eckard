const { errorResponse } = require('../utils/response');

/**
 * Restrict route to specific roles
 * Usage: requireRole('admin')  or  requireRole(['admin', 'superadmin'])
 */
const requireRole = (role) => {
  const allowedRoles = Array.isArray(role) ? role : [role];
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied: insufficient permissions', 403);
    }
    next();
  };
};

module.exports = { requireRole };
