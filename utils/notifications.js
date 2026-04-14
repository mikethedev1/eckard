const pool = require('../config/db');
const logger = require('./logger');

/**
 * Create a notification for a specific user or broadcast (user_id = 0)
 */
const createNotification = async ({ userId, title, message, type = 'info', actionUrl = null }) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, action_url)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, message, type, actionUrl]
    );
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
};

/**
 * Broadcast a notification to all active users
 */
const broadcastNotification = async ({ title, message, type = 'info', actionUrl = null }) => {
  try {
    const [users] = await pool.query(
      `SELECT id FROM users WHERE role = 'user' AND status = 'active' AND deleted_at IS NULL`
    );
    const values = users.map(u => [u.id, title, message, type, actionUrl]);
    if (values.length) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, action_url) VALUES ?`,
        [values]
      );
    }
  } catch (err) {
    logger.error('Failed to broadcast notification:', err.message);
  }
};

module.exports = { createNotification, broadcastNotification };
