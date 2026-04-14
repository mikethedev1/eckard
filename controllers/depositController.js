const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../utils/notifications');
const { writeAudit } = require('../utils/audit');
const logger = require('../utils/logger');

// ─── CREATE DEPOSIT REQUEST ───────────────────────────────────────────────
const createDeposit = async (req, res) => {
  const { amount, method, reference, notes } = req.body;
  const userId = req.user.id;
  const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      `INSERT INTO deposits (user_id, amount, method, proof_image, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, amount, method || 'bank_transfer', proofImage, reference || null, notes || null]
    );

    await writeAudit({
      actionType: 'DEPOSIT_CREATED',
      performedBy: userId,
      targetTable: 'deposits',
      targetId: result.insertId,
      newValues: { amount, method },
      ipAddress: req.ip,
    });

    const [[deposit]] = await pool.query('SELECT * FROM deposits WHERE id = ?', [result.insertId]);

    return successResponse(res, deposit, 'Deposit request submitted. Pending admin approval.', 201);
  } catch (err) {
    logger.error('createDeposit error:', err);
    return errorResponse(res, 'Failed to submit deposit request', 500);
  }
};

// ─── GET USER DEPOSITS ────────────────────────────────────────────────────
const getUserDeposits = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE user_id = ?';
    const params = [userId];
    if (status) { where += ' AND status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM deposits ${where}`, params
    );

    const [deposits] = await pool.query(
      `SELECT uuid, amount, method, proof_image, reference, status,
              rejection_reason, notes, created_at, updated_at
       FROM deposits ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, deposits, buildMeta(total));
  } catch (err) {
    logger.error('getUserDeposits error:', err);
    return errorResponse(res, 'Failed to fetch deposits', 500);
  }
};

// ─── GET SINGLE DEPOSIT ───────────────────────────────────────────────────
const getDeposit = async (req, res) => {
  try {
    const [[deposit]] = await pool.query(
      'SELECT * FROM deposits WHERE uuid = ? AND user_id = ?',
      [req.params.uuid, req.user.id]
    );
    if (!deposit) return errorResponse(res, 'Deposit not found', 404);
    return successResponse(res, deposit);
  } catch (err) {
    logger.error('getDeposit error:', err);
    return errorResponse(res, 'Failed to fetch deposit', 500);
  }
};

module.exports = { createDeposit, getUserDeposits, getDeposit };
