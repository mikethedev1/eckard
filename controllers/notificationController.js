const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

// ─── GET USER NOTIFICATIONS ───────────────────────────────────────────────
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ?`, [userId]
    );

    const [notifications] = await pool.query(
      `SELECT id, title, message, type, is_read, action_url, created_at
       FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    return paginatedResponse(res, notifications, buildMeta(total));
  } catch (err) {
    logger.error('getNotifications error:', err);
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
};

// ─── MARK ALL AS READ ─────────────────────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id]
    );
    return successResponse(res, {}, 'All notifications marked as read');
  } catch (err) {
    logger.error('markAllRead error:', err);
    return errorResponse(res, 'Failed to update notifications', 500);
  }
};

// ─── MARK SINGLE AS READ ──────────────────────────────────────────────────
const markRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return successResponse(res, {}, 'Notification marked as read');
  } catch (err) {
    logger.error('markRead error:', err);
    return errorResponse(res, 'Failed to update notification', 500);
  }
};

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );
    return successResponse(res, { count });
  } catch (err) {
    logger.error('getUnreadCount error:', err);
    return errorResponse(res, 'Failed to fetch notification count', 500);
  }
};

module.exports = { getNotifications, markAllRead, markRead, getUnreadCount };
