const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const { writeAudit } = require('../utils/audit');
const logger = require('../utils/logger');

// ─── CREATE WITHDRAWAL REQUEST ────────────────────────────────────────────
const createWithdrawal = async (req, res) => {
  const { amount, method, account_details, notes } = req.body;
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[user]] = await connection.query(
      'SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]
    );

    if (parseFloat(user.balance) < amount) {
      await connection.rollback();
      return errorResponse(res, 'Insufficient balance for this withdrawal', 400);
    }

    // Check no other pending withdrawal
    const [[pending]] = await connection.query(
      `SELECT COUNT(*) AS cnt FROM withdrawals WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );
    if (pending.cnt > 0) {
      await connection.rollback();
      return errorResponse(res, 'You already have a pending withdrawal request', 400);
    }

    const [result] = await connection.query(
      `INSERT INTO withdrawals (user_id, amount, method, account_details, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, amount, method || 'bank_transfer', JSON.stringify(account_details), notes || null]
    );

    await connection.commit();

    await writeAudit({
      actionType: 'WITHDRAWAL_CREATED',
      performedBy: userId,
      targetTable: 'withdrawals',
      targetId: result.insertId,
      newValues: { amount, method },
      ipAddress: req.ip,
    });

    const [[withdrawal]] = await pool.query(
      'SELECT * FROM withdrawals WHERE id = ?', [result.insertId]
    );

    return successResponse(res, withdrawal, 'Withdrawal request submitted. Pending admin approval.', 201);
  } catch (err) {
    await connection.rollback();
    logger.error('createWithdrawal error:', err);
    return errorResponse(res, 'Failed to submit withdrawal request', 500);
  } finally {
    connection.release();
  }
};

// ─── GET USER WITHDRAWALS ─────────────────────────────────────────────────
const getUserWithdrawals = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE user_id = ?';
    const params = [userId];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM withdrawals ${where}`, params
    );

    const [withdrawals] = await pool.query(
      `SELECT uuid, amount, method, account_details, status,
              rejection_reason, notes, created_at, updated_at
       FROM withdrawals ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, withdrawals, buildMeta(total));
  } catch (err) {
    logger.error('getUserWithdrawals error:', err);
    return errorResponse(res, 'Failed to fetch withdrawals', 500);
  }
};

// ─── GET SINGLE WITHDRAWAL ────────────────────────────────────────────────
const getWithdrawal = async (req, res) => {
  try {
    const [[withdrawal]] = await pool.query(
      'SELECT * FROM withdrawals WHERE uuid = ? AND user_id = ?',
      [req.params.uuid, req.user.id]
    );
    if (!withdrawal) return errorResponse(res, 'Withdrawal not found', 404);
    return successResponse(res, withdrawal);
  } catch (err) {
    logger.error('getWithdrawal error:', err);
    return errorResponse(res, 'Failed to fetch withdrawal', 500);
  }
};

module.exports = { createWithdrawal, getUserWithdrawals, getWithdrawal };
