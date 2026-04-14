const pool = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { writeAudit } = require('../utils/audit');
const logger = require('../utils/logger');

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { first_name, last_name, phone, country, address } = req.body;
  try {
    const [before] = await pool.query(
      'SELECT first_name, last_name, phone, country, address FROM users WHERE id = ?',
      [req.user.id]
    );

    await pool.query(
      `UPDATE users SET first_name=?, last_name=?, phone=?, country=?, address=?
       WHERE id = ?`,
      [first_name || before[0].first_name,
       last_name  || before[0].last_name,
       phone  ?? before[0].phone,
       country?? before[0].country,
       address?? before[0].address,
       req.user.id]
    );

    await writeAudit({
      actionType: 'PROFILE_UPDATE',
      performedBy: req.user.id,
      targetTable: 'users',
      targetId: req.user.id,
      oldValues: before[0],
      newValues: req.body,
      ipAddress: req.ip,
    });

    const [updated] = await pool.query(
      `SELECT id, uuid, first_name, last_name, email, phone, role, balance,
              status, avatar, country, address, kyc_status, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    return successResponse(res, updated[0], 'Profile updated successfully');
  } catch (err) {
    logger.error('updateProfile error:', err);
    return errorResponse(res, 'Failed to update profile', 500);
  }
};

// ─── UPLOAD AVATAR ────────────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  if (!req.file) return errorResponse(res, 'No file uploaded', 400);
  try {
    const avatarPath = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);
    return successResponse(res, { avatar: avatarPath }, 'Avatar updated successfully');
  } catch (err) {
    logger.error('uploadAvatar error:', err);
    return errorResponse(res, 'Failed to upload avatar', 500);
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[user]] = await pool.query(
      'SELECT balance FROM users WHERE id = ?', [userId]
    );

    const [[investStats]] = await pool.query(`
      SELECT
        COUNT(*)                                              AS total_investments,
        COALESCE(SUM(amount), 0)                             AS total_invested,
        COALESCE(SUM(CASE WHEN status='active' THEN amount END), 0) AS active_amount,
        COALESCE(SUM(profit), 0)                             AS total_profit
      FROM investments WHERE user_id = ? AND status != 'cancelled'
    `, [userId]);

    const [[depositStats]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status='approved' THEN amount END), 0) AS total_deposits,
        COUNT(CASE WHEN status='pending'  THEN 1 END)                 AS pending_deposits
      FROM deposits WHERE user_id = ?
    `, [userId]);

    const [[withdrawStats]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status='approved' THEN amount END), 0) AS total_withdrawn,
        COUNT(CASE WHEN status='pending' THEN 1 END)                  AS pending_withdrawals
      FROM withdrawals WHERE user_id = ?
    `, [userId]);

    const [recentTransactions] = await pool.query(`
      SELECT uuid, type, amount, description, status, created_at
      FROM transactions WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 10
    `, [userId]);

    const [activeInvestments] = await pool.query(`
      SELECT i.uuid, i.amount, i.roi_rate, i.profit, i.start_date, i.end_date, i.status,
             p.name AS plan_name
      FROM investments i
      JOIN plans p ON p.id = i.plan_id
      WHERE i.user_id = ? AND i.status = 'active'
      ORDER BY i.created_at DESC LIMIT 5
    `, [userId]);

    const [unreadNotifications] = await pool.query(`
      SELECT COUNT(*) AS count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `, [userId]);

    return successResponse(res, {
      balance: parseFloat(user.balance),
      stats: {
        total_investments: investStats.total_investments,
        total_invested:    parseFloat(investStats.total_invested),
        active_amount:     parseFloat(investStats.active_amount),
        total_profit:      parseFloat(investStats.total_profit),
        total_deposits:    parseFloat(depositStats.total_deposits),
        pending_deposits:  depositStats.pending_deposits,
        total_withdrawn:   parseFloat(withdrawStats.total_withdrawn),
        pending_withdrawals: withdrawStats.pending_withdrawals,
      },
      recent_transactions: recentTransactions,
      active_investments:  activeInvestments,
      unread_notifications: unreadNotifications[0].count,
    });
  } catch (err) {
    logger.error('getDashboard error:', err);
    return errorResponse(res, 'Failed to load dashboard', 500);
  }
};

module.exports = { updateProfile, uploadAvatar, getDashboard };
