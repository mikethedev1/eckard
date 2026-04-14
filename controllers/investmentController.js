const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const { createNotification } = require('../utils/notifications');
const { writeAudit } = require('../utils/audit');
const logger = require('../utils/logger');

// ─── GET ALL PLANS (public) ───────────────────────────────────────────────
const getPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      'SELECT * FROM plans WHERE is_active = 1 ORDER BY min_amount ASC'
    );
    return successResponse(res, plans);
  } catch (err) {
    logger.error('getPlans error:', err);
    return errorResponse(res, 'Failed to fetch plans', 500);
  }
};

// ─── CREATE INVESTMENT ────────────────────────────────────────────────────
const createInvestment = async (req, res) => {
  const { plan_id, amount } = req.body;
  const userId = req.user.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
 
    // Lock user row
    const [[user]] = await connection.query(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE', [userId]
    );
 
    const [[plan]] = await connection.query(
      'SELECT * FROM plans WHERE id = ? AND is_active = 1', [plan_id]
    );
 
    if (!plan) {
      await connection.rollback();
      return errorResponse(res, 'Plan not found or inactive', 404);
    }
 
    // Parse all numeric fields from DB explicitly — MySQL returns DECIMAL as strings
    const roiMin     = parseFloat(plan.roi_min);
    const roiMax     = parseFloat(plan.roi_max);
    const minAmount  = parseFloat(plan.min_amount);
    const maxAmount  = parseFloat(plan.max_amount);
    const parsedAmount  = parseFloat(amount);
    const userBalance   = parseFloat(user.balance);
 
    if (parsedAmount < minAmount || parsedAmount > maxAmount) {
      await connection.rollback();
      return errorResponse(res, `Investment amount must be between $${minAmount} and $${maxAmount}`, 422);
    }
 
    if (userBalance < parsedAmount) {
      await connection.rollback();
      return errorResponse(res, 'Insufficient balance. Please deposit funds first.', 400);
    }
 
    // Apply ROI (midpoint of range)
    const roiRate    = ((roiMin + roiMax) / 2).toFixed(2);
    const profit     = ((parsedAmount * parseFloat(roiRate)) / 100).toFixed(2);
    const totalReturn = (parsedAmount + parseFloat(profit)).toFixed(2);
    const newBalance  = (userBalance - parsedAmount).toFixed(2);
    const endDate     = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000);
 
    // Deduct balance
    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance, userId]);
 
    // Create investment
    const [invResult] = await connection.query(
      `INSERT INTO investments
         (user_id, plan_id, amount, roi_rate, profit, total_return, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, plan_id, parsedAmount, roiRate, profit, totalReturn, endDate]
    );
 
    // Log transaction
    await connection.query(
      `INSERT INTO transactions
         (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
       VALUES (?, 'investment', ?, ?, ?, ?, 'investment', ?)`,
      [userId, parsedAmount, user.balance, newBalance, invResult.insertId,
       `Investment in ${plan.name}`]
    );
 
    await connection.commit();
 
    await createNotification({
      userId,
      title: 'Investment Confirmed',
      message: `Your $${parsedAmount} investment in ${plan.name} has been activated. Expected return: $${totalReturn}`,
      type: 'success',
      actionUrl: '/investments',
    });
 
    await writeAudit({
      actionType: 'INVESTMENT_CREATED',
      performedBy: userId,
      targetTable: 'investments',
      targetId: invResult.insertId,
      newValues: { plan_id, amount: parsedAmount, roi_rate: roiRate },
      ipAddress: req.ip,
    });
 
    const [[investment]] = await pool.query(
      `SELECT i.*, p.name AS plan_name FROM investments i
       JOIN plans p ON p.id = i.plan_id WHERE i.id = ?`,
      [invResult.insertId]
    );
 
    return successResponse(res, investment, 'Investment created successfully', 201);
  } catch (err) {
    await connection.rollback();
    logger.error('createInvestment error:', err);
    return errorResponse(res, 'Failed to create investment', 500);
  } finally {
    connection.release();
  }
};


// ─── GET USER'S INVESTMENTS ───────────────────────────────────────────────
const getUserInvestments = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE i.user_id = ?';
    const params = [userId];
    if (status) { where += ' AND i.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM investments i ${where}`, params
    );

    const [investments] = await pool.query(
      `SELECT i.uuid, i.amount, i.roi_rate, i.profit, i.total_return,
              i.status, i.start_date, i.end_date, i.completed_at, i.created_at,
              p.name AS plan_name, p.duration_days
       FROM investments i JOIN plans p ON p.id = i.plan_id
       ${where}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, investments, buildMeta(total));
  } catch (err) {
    logger.error('getUserInvestments error:', err);
    return errorResponse(res, 'Failed to fetch investments', 500);
  }
};

// ─── GET SINGLE INVESTMENT ────────────────────────────────────────────────
const getInvestment = async (req, res) => {
  try {
    const [[investment]] = await pool.query(
      `SELECT i.*, p.name AS plan_name, p.features
       FROM investments i JOIN plans p ON p.id = i.plan_id
       WHERE i.uuid = ? AND i.user_id = ?`,
      [req.params.uuid, req.user.id]
    );
    if (!investment) return errorResponse(res, 'Investment not found', 404);
    return successResponse(res, investment);
  } catch (err) {
    logger.error('getInvestment error:', err);
    return errorResponse(res, 'Failed to fetch investment', 500);
  }
};

module.exports = { getPlans, createInvestment, getUserInvestments, getInvestment };
