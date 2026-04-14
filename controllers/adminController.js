const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate }  = require('../utils/paginate');
const { logAdminAction, writeAudit } = require('../utils/audit');
const { createNotification, broadcastNotification } = require('../utils/notifications');
const logger = require('../utils/logger');

// ═══════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════
const getAdminDashboard = async (req, res) => {
  try {
    const [[users]]        = await pool.query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN status='active' THEN 1 END) AS active FROM users WHERE role='user' AND deleted_at IS NULL`);
    const [[investments]]  = await pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS volume, COUNT(CASE WHEN status='active' THEN 1 END) AS active_count FROM investments`);
    const [[deposits]]     = await pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN amount END),0) AS approved_total, COUNT(CASE WHEN status='pending' THEN 1 END) AS pending FROM deposits`);
    const [[withdrawals]]  = await pool.query(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN amount END),0) AS approved_total, COUNT(CASE WHEN status='pending' THEN 1 END) AS pending FROM withdrawals`);
    const [[tickets]]      = await pool.query(`SELECT COUNT(CASE WHEN status='open' THEN 1 END) AS open_count FROM support_tickets`);
    const [[profit]]       = await pool.query(`SELECT COALESCE(SUM(profit),0) AS total_profit FROM investments WHERE status='completed'`);

    // Revenue last 12 months
    const [revenueChart] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             COALESCE(SUM(amount), 0)          AS total
      FROM deposits WHERE status='approved'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    // User growth last 12 months
    const [userGrowth] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             COUNT(*) AS new_users
      FROM users WHERE role='user' AND deleted_at IS NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month ORDER BY month ASC
    `);

    // Investment distribution by plan
    const [investDist] = await pool.query(`
      SELECT p.name, COUNT(*) AS count, COALESCE(SUM(i.amount),0) AS total
      FROM investments i JOIN plans p ON p.id = i.plan_id
      GROUP BY p.id, p.name
    `);

    // Recent activity
    const [recentDeposits] = await pool.query(`
      SELECT d.uuid, d.amount, d.status, d.created_at,
             u.first_name, u.last_name, u.email
      FROM deposits d JOIN users u ON u.id = d.user_id
      ORDER BY d.created_at DESC LIMIT 5
    `);

    const [recentWithdrawals] = await pool.query(`
      SELECT w.uuid, w.amount, w.status, w.created_at,
             u.first_name, u.last_name, u.email
      FROM withdrawals w JOIN users u ON u.id = w.user_id
      ORDER BY w.created_at DESC LIMIT 5
    `);

    return successResponse(res, {
      stats: {
        total_users:        users.total,
        active_users:       users.active,
        total_investments:  investments.total,
        investment_volume:  parseFloat(investments.volume),
        active_investments: investments.active_count,
        total_deposits:     parseFloat(deposits.approved_total),
        pending_deposits:   deposits.pending,
        total_withdrawals:  parseFloat(withdrawals.approved_total),
        pending_withdrawals: withdrawals.pending,
        open_tickets:       tickets.open_count,
        platform_profit:    parseFloat(profit.total_profit),
      },
      charts: { revenue: revenueChart, user_growth: userGrowth, investment_dist: investDist },
      recent: { deposits: recentDeposits, withdrawals: recentWithdrawals },
    });
  } catch (err) {
    logger.error('adminDashboard error:', err);
    return errorResponse(res, 'Failed to load dashboard', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ═══════════════════════════════════════════════════════════
const getUsers = async (req, res) => {
  const { search, status, role } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE deleted_at IS NULL';
    const params = [];

    if (search) {
      where += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) { where += ' AND status = ?'; params.push(status); }
    if (role)   { where += ' AND role = ?';   params.push(role);   }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users ${where}`, params
    );

    const [users] = await pool.query(
      `SELECT id, uuid, first_name, last_name, email, phone, role, balance,
              status, country, kyc_status, last_login, created_at
       FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, users, buildMeta(total));
  } catch (err) {
    logger.error('admin getUsers error:', err);
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

const getUser = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT id, uuid, first_name, last_name, email, phone, role, balance,
              status, country, address, kyc_status, last_login, created_at
       FROM users WHERE id = ? AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (!user) return errorResponse(res, 'User not found', 404);

    // User stats
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM deposits    WHERE user_id=? AND status='approved') AS total_deposited,
        (SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE user_id=? AND status='approved') AS total_withdrawn,
        (SELECT COALESCE(SUM(amount),0) FROM investments WHERE user_id=? AND status!='cancelled') AS total_invested,
        (SELECT COUNT(*)                FROM investments WHERE user_id=? AND status='active')    AS active_investments
    `, [user.id, user.id, user.id, user.id]);

    return successResponse(res, { ...user, stats });
  } catch (err) {
    logger.error('admin getUser error:', err);
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

const updateUser = async (req, res) => {
  const { first_name, last_name, email, phone, balance, role, status, country } = req.body;
  const userId = req.params.id;

  try {
    const [[before]] = await pool.query(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [userId]
    );
    if (!before) return errorResponse(res, 'User not found', 404);

    await pool.query(
      `UPDATE users SET
         first_name = COALESCE(?, first_name),
         last_name  = COALESCE(?, last_name),
         email      = COALESCE(?, email),
         phone      = COALESCE(?, phone),
         balance    = COALESCE(?, balance),
         role       = COALESCE(?, role),
         status     = COALESCE(?, status),
         country    = COALESCE(?, country)
       WHERE id = ?`,
      [first_name, last_name, email, phone, balance, role, status, country, userId]
    );

    await logAdminAction({
      adminId: req.user.id,
      action: 'UPDATE_USER',
      targetType: 'user',
      targetId: userId,
      metadata: { before: { balance: before.balance, status: before.status }, after: req.body },
      ipAddress: req.ip,
    });

    await writeAudit({
      actionType: 'ADMIN_UPDATE_USER',
      performedBy: req.user.id,
      targetTable: 'users',
      targetId: userId,
      oldValues: before,
      newValues: req.body,
      ipAddress: req.ip,
    });

    if (status && status !== before.status) {
      await createNotification({
        userId: parseInt(userId),
        title: status === 'banned' ? 'Account Suspended' : 'Account Status Updated',
        message: status === 'banned'
          ? 'Your account has been suspended. Contact support for assistance.'
          : `Your account status has been updated to: ${status}`,
        type: status === 'banned' ? 'error' : 'info',
      });
    }

    const [[updated]] = await pool.query(
      'SELECT id, uuid, first_name, last_name, email, phone, role, balance, status, country FROM users WHERE id = ?',
      [userId]
    );
    return successResponse(res, updated, 'User updated successfully');
  } catch (err) {
    logger.error('admin updateUser error:', err);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const [[user]] = await pool.query(
      'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL', [userId]
    );
    if (!user) return errorResponse(res, 'User not found', 404);
    if (user.role === 'admin') return errorResponse(res, 'Cannot delete admin accounts', 403);

    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [userId]);

    await logAdminAction({
      adminId: req.user.id, action: 'DELETE_USER',
      targetType: 'user', targetId: userId, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'User deleted successfully');
  } catch (err) {
    logger.error('admin deleteUser error:', err);
    return errorResponse(res, 'Failed to delete user', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  INVESTMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════
const getInvestments = async (req, res) => {
  const { status, plan_id, user_id } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (status)  { where += ' AND i.status = ?';  params.push(status);  }
    if (plan_id) { where += ' AND i.plan_id = ?'; params.push(plan_id); }
    if (user_id) { where += ' AND i.user_id = ?'; params.push(user_id); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM investments i ${where}`, params
    );

    const [investments] = await pool.query(
      `SELECT i.uuid, i.amount, i.roi_rate, i.profit, i.total_return,
              i.status, i.start_date, i.end_date, i.created_at,
              p.name AS plan_name,
              u.first_name, u.last_name, u.email
       FROM investments i
       JOIN plans p ON p.id = i.plan_id
       JOIN users u ON u.id = i.user_id
       ${where}
       ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, investments, buildMeta(total));
  } catch (err) {
    logger.error('admin getInvestments error:', err);
    return errorResponse(res, 'Failed to fetch investments', 500);
  }
};

const updateInvestment = async (req, res) => {
  const { status, profit, notes } = req.body;
  const invId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[investment]] = await connection.query(
      'SELECT * FROM investments WHERE id = ? FOR UPDATE', [invId]
    );
    if (!investment) { await connection.rollback(); return errorResponse(res, 'Investment not found', 404); }

    // If forcing complete
    if (status === 'completed' && investment.status === 'active') {
      const [[user]] = await connection.query(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE', [investment.user_id]
      );
      const appliedProfit = profit !== undefined ? parseFloat(profit) : parseFloat(investment.profit);
      const totalReturn   = parseFloat(investment.amount) + appliedProfit;
      const newBalance    = (parseFloat(user.balance) + totalReturn).toFixed(2);

      await connection.query(
        `UPDATE investments SET status='completed', profit=?, total_return=?, completed_at=NOW()
         WHERE id = ?`,
        [appliedProfit, totalReturn, invId]
      );
      await connection.query(
        'UPDATE users SET balance = ? WHERE id = ?', [newBalance, investment.user_id]
      );
      await connection.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
         VALUES (?, 'profit', ?, ?, ?, ?, 'investment', 'Investment completed - principal + profit returned')`,
        [investment.user_id, totalReturn, user.balance, newBalance, invId]
      );

      await createNotification({
        userId: investment.user_id,
        title: 'Investment Completed',
        message: `Your investment has matured. $${totalReturn.toFixed(2)} (principal + profit) has been credited to your balance.`,
        type: 'success',
        actionUrl: '/investments',
      });
    } else {
      await connection.query(
        `UPDATE investments SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?`,
        [status, notes, invId]
      );
    }

    await connection.commit();

    await logAdminAction({
      adminId: req.user.id, action: 'UPDATE_INVESTMENT',
      targetType: 'investment', targetId: invId,
      metadata: { status, profit }, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Investment updated successfully');
  } catch (err) {
    await connection.rollback();
    logger.error('admin updateInvestment error:', err);
    return errorResponse(res, 'Failed to update investment', 500);
  } finally {
    connection.release();
  }
};

// ═══════════════════════════════════════════════════════════
//  DEPOSIT MANAGEMENT
// ═══════════════════════════════════════════════════════════
const getDeposits = async (req, res) => {
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND d.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM deposits d ${where}`, params
    );

    const [deposits] = await pool.query(
      `SELECT d.id, d.uuid, d.amount, d.method, d.proof_image, d.reference,
              d.status, d.rejection_reason, d.notes, d.created_at,
              u.first_name, u.last_name, u.email, u.id AS user_id
       FROM deposits d JOIN users u ON u.id = d.user_id
       ${where}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, deposits, buildMeta(total));
  } catch (err) {
    logger.error('admin getDeposits error:', err);
    return errorResponse(res, 'Failed to fetch deposits', 500);
  }
};

const approveDeposit = async (req, res) => {
  const depId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[deposit]] = await connection.query(
      'SELECT * FROM deposits WHERE id = ? FOR UPDATE', [depId]
    );
    if (!deposit) { await connection.rollback(); return errorResponse(res, 'Deposit not found', 404); }
    if (deposit.status !== 'pending') {
      await connection.rollback();
      return errorResponse(res, `Deposit is already ${deposit.status}`, 400);
    }

    const [[user]] = await connection.query(
      'SELECT balance FROM users WHERE id = ? FOR UPDATE', [deposit.user_id]
    );
    const newBalance = (parseFloat(user.balance) + parseFloat(deposit.amount)).toFixed(2);

    await connection.query(
      `UPDATE deposits SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [req.user.id, depId]
    );
    await connection.query(
      'UPDATE users SET balance = ? WHERE id = ?', [newBalance, deposit.user_id]
    );
    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
       VALUES (?, 'deposit', ?, ?, ?, ?, 'deposit', 'Deposit approved by admin')`,
      [deposit.user_id, deposit.amount, user.balance, newBalance, depId]
    );

    await connection.commit();

    await createNotification({
      userId: deposit.user_id,
      title: 'Deposit Approved',
      message: `Your deposit of $${deposit.amount} has been approved and credited to your account.`,
      type: 'success',
      actionUrl: '/deposits',
    });

    await logAdminAction({
      adminId: req.user.id, action: 'APPROVE_DEPOSIT',
      targetType: 'deposit', targetId: depId,
      metadata: { amount: deposit.amount, user_id: deposit.user_id },
      ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Deposit approved successfully');
  } catch (err) {
    await connection.rollback();
    logger.error('approveDeposit error:', err);
    return errorResponse(res, 'Failed to approve deposit', 500);
  } finally {
    connection.release();
  }
};

const rejectDeposit = async (req, res) => {
  const { rejection_reason } = req.body;
  const depId = req.params.id;

  try {
    const [[deposit]] = await pool.query('SELECT * FROM deposits WHERE id = ?', [depId]);
    if (!deposit) return errorResponse(res, 'Deposit not found', 404);
    if (deposit.status !== 'pending') return errorResponse(res, `Deposit is already ${deposit.status}`, 400);

    await pool.query(
      `UPDATE deposits SET status='rejected', reviewed_by=?, reviewed_at=NOW(), rejection_reason=? WHERE id=?`,
      [req.user.id, rejection_reason, depId]
    );

    await createNotification({
      userId: deposit.user_id,
      title: 'Deposit Rejected',
      message: `Your deposit of $${deposit.amount} was rejected. Reason: ${rejection_reason}`,
      type: 'error',
      actionUrl: '/deposits',
    });

    await logAdminAction({
      adminId: req.user.id, action: 'REJECT_DEPOSIT',
      targetType: 'deposit', targetId: depId,
      metadata: { reason: rejection_reason }, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Deposit rejected');
  } catch (err) {
    logger.error('rejectDeposit error:', err);
    return errorResponse(res, 'Failed to reject deposit', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  WITHDRAWAL MANAGEMENT
// ═══════════════════════════════════════════════════════════
const getWithdrawals = async (req, res) => {
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND w.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM withdrawals w ${where}`, params
    );

    const [withdrawals] = await pool.query(
      `SELECT w.id, w.uuid, w.amount, w.method, w.account_details, w.status,
              w.rejection_reason, w.notes, w.created_at,
              u.first_name, u.last_name, u.email, u.balance AS user_balance, u.id AS user_id
       FROM withdrawals w JOIN users u ON u.id = w.user_id
       ${where}
       ORDER BY w.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, withdrawals, buildMeta(total));
  } catch (err) {
    logger.error('admin getWithdrawals error:', err);
    return errorResponse(res, 'Failed to fetch withdrawals', 500);
  }
};

const approveWithdrawal = async (req, res) => {
  const wdId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[withdrawal]] = await connection.query(
      'SELECT * FROM withdrawals WHERE id = ? FOR UPDATE', [wdId]
    );
    if (!withdrawal) { await connection.rollback(); return errorResponse(res, 'Withdrawal not found', 404); }
    if (withdrawal.status !== 'pending') {
      await connection.rollback();
      return errorResponse(res, `Withdrawal is already ${withdrawal.status}`, 400);
    }

    const [[user]] = await connection.query(
      'SELECT balance FROM users WHERE id = ? FOR UPDATE', [withdrawal.user_id]
    );

    if (parseFloat(user.balance) < parseFloat(withdrawal.amount)) {
      await connection.rollback();
      return errorResponse(res, 'User has insufficient balance for this withdrawal', 400);
    }

    const newBalance = (parseFloat(user.balance) - parseFloat(withdrawal.amount)).toFixed(2);

    await connection.query(
      `UPDATE withdrawals SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE id=?`,
      [req.user.id, wdId]
    );
    await connection.query(
      'UPDATE users SET balance = ? WHERE id = ?', [newBalance, withdrawal.user_id]
    );
    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
       VALUES (?, 'withdrawal', ?, ?, ?, ?, 'withdrawal', 'Withdrawal approved by admin')`,
      [withdrawal.user_id, withdrawal.amount, user.balance, newBalance, wdId]
    );

    await connection.commit();

    await createNotification({
      userId: withdrawal.user_id,
      title: 'Withdrawal Approved',
      message: `Your withdrawal of $${withdrawal.amount} has been approved and is being processed.`,
      type: 'success',
      actionUrl: '/withdrawals',
    });

    await logAdminAction({
      adminId: req.user.id, action: 'APPROVE_WITHDRAWAL',
      targetType: 'withdrawal', targetId: wdId,
      metadata: { amount: withdrawal.amount, user_id: withdrawal.user_id },
      ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Withdrawal approved successfully');
  } catch (err) {
    await connection.rollback();
    logger.error('approveWithdrawal error:', err);
    return errorResponse(res, 'Failed to approve withdrawal', 500);
  } finally {
    connection.release();
  }
};

const rejectWithdrawal = async (req, res) => {
  const { rejection_reason } = req.body;
  const wdId = req.params.id;

  try {
    const [[withdrawal]] = await pool.query('SELECT * FROM withdrawals WHERE id = ?', [wdId]);
    if (!withdrawal) return errorResponse(res, 'Withdrawal not found', 404);
    if (withdrawal.status !== 'pending') return errorResponse(res, `Withdrawal is already ${withdrawal.status}`, 400);

    await pool.query(
      `UPDATE withdrawals SET status='rejected', reviewed_by=?, reviewed_at=NOW(), rejection_reason=? WHERE id=?`,
      [req.user.id, rejection_reason, wdId]
    );

    await createNotification({
      userId: withdrawal.user_id,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request of $${withdrawal.amount} was rejected. Reason: ${rejection_reason}`,
      type: 'error',
      actionUrl: '/withdrawals',
    });

    await logAdminAction({
      adminId: req.user.id, action: 'REJECT_WITHDRAWAL',
      targetType: 'withdrawal', targetId: wdId,
      metadata: { reason: rejection_reason }, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Withdrawal rejected');
  } catch (err) {
    logger.error('rejectWithdrawal error:', err);
    return errorResponse(res, 'Failed to reject withdrawal', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  PLAN MANAGEMENT
// ═══════════════════════════════════════════════════════════
const getAdminPlans = async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM plans ORDER BY min_amount ASC');
    return successResponse(res, plans);
  } catch (err) {
    return errorResponse(res, 'Failed to fetch plans', 500);
  }
};

const createPlan = async (req, res) => {
  const { name, description, min_amount, max_amount, roi_min, roi_max, duration_days, features, is_active } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO plans (name, description, min_amount, max_amount, roi_min, roi_max, duration_days, features, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, min_amount, max_amount, roi_min, roi_max, duration_days,
       features ? JSON.stringify(features) : null, is_active !== false ? 1 : 0]
    );

    await logAdminAction({
      adminId: req.user.id, action: 'CREATE_PLAN',
      targetType: 'plan', targetId: result.insertId,
      metadata: req.body, ipAddress: req.ip,
    });

    const [[plan]] = await pool.query('SELECT * FROM plans WHERE id = ?', [result.insertId]);
    return successResponse(res, plan, 'Plan created successfully', 201);
  } catch (err) {
    logger.error('createPlan error:', err);
    return errorResponse(res, 'Failed to create plan', 500);
  }
};

const updatePlan = async (req, res) => {
  const planId = req.params.id;
  const { name, description, min_amount, max_amount, roi_min, roi_max, duration_days, features, is_active } = req.body;
  try {
    const [[before]] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!before) return errorResponse(res, 'Plan not found', 404);

    await pool.query(
      `UPDATE plans SET
         name          = COALESCE(?, name),
         description   = COALESCE(?, description),
         min_amount    = COALESCE(?, min_amount),
         max_amount    = COALESCE(?, max_amount),
         roi_min       = COALESCE(?, roi_min),
         roi_max       = COALESCE(?, roi_max),
         duration_days = COALESCE(?, duration_days),
         features      = COALESCE(?, features),
         is_active     = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, min_amount, max_amount, roi_min, roi_max, duration_days,
       features ? JSON.stringify(features) : null,
       is_active !== undefined ? (is_active ? 1 : 0) : null, planId]
    );

    await logAdminAction({
      adminId: req.user.id, action: 'UPDATE_PLAN',
      targetType: 'plan', targetId: planId,
      metadata: req.body, ipAddress: req.ip,
    });

    const [[updated]] = await pool.query('SELECT * FROM plans WHERE id = ?', [planId]);
    return successResponse(res, updated, 'Plan updated successfully');
  } catch (err) {
    logger.error('updatePlan error:', err);
    return errorResponse(res, 'Failed to update plan', 500);
  }
};

const deletePlan = async (req, res) => {
  const planId = req.params.id;
  try {
    const [[plan]] = await pool.query('SELECT id FROM plans WHERE id = ?', [planId]);
    if (!plan) return errorResponse(res, 'Plan not found', 404);

    // Check active investments
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM investments WHERE plan_id = ? AND status = 'active'`, [planId]
    );
    if (cnt > 0) {
      return errorResponse(res, 'Cannot delete plan with active investments', 400);
    }

    await pool.query('DELETE FROM plans WHERE id = ?', [planId]);

    await logAdminAction({
      adminId: req.user.id, action: 'DELETE_PLAN',
      targetType: 'plan', targetId: planId, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Plan deleted successfully');
  } catch (err) {
    logger.error('deletePlan error:', err);
    return errorResponse(res, 'Failed to delete plan', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  SUPPORT TICKET MANAGEMENT (ADMIN)
// ═══════════════════════════════════════════════════════════
const getAdminTickets = async (req, res) => {
  const { status, priority } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (status)   { where += ' AND t.status = ?';   params.push(status);   }
    if (priority) { where += ' AND t.priority = ?'; params.push(priority); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM support_tickets t ${where}`, params
    );

    const [tickets] = await pool.query(
      `SELECT t.id, t.uuid, t.subject, t.priority, t.status, t.created_at, t.updated_at,
              u.first_name, u.last_name, u.email,
              (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) AS message_count
       FROM support_tickets t JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, tickets, buildMeta(total));
  } catch (err) {
    logger.error('admin getTickets error:', err);
    return errorResponse(res, 'Failed to fetch tickets', 500);
  }
};

const getAdminTicket = async (req, res) => {
  try {
    const [[ticket]] = await pool.query(
      `SELECT t.*, u.first_name, u.last_name, u.email
       FROM support_tickets t JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    const [messages] = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.avatar, u.role
       FROM ticket_messages m JOIN users u ON u.id = m.sender_id
       WHERE m.ticket_id = ? ORDER BY m.created_at ASC`,
      [ticket.id]
    );

    return successResponse(res, { ticket, messages });
  } catch (err) {
    logger.error('admin getTicket error:', err);
    return errorResponse(res, 'Failed to fetch ticket', 500);
  }
};

const replyAdminTicket = async (req, res) => {
  const { message, status } = req.body;
  const ticketId = req.params.id;

  try {
    const [[ticket]] = await pool.query('SELECT * FROM support_tickets WHERE id = ?', [ticketId]);
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message, is_admin) VALUES (?, ?, ?, 1)`,
      [ticketId, req.user.id, message]
    );

    const newStatus = status || 'in_progress';
    await pool.query(
      `UPDATE support_tickets SET status = ?, assigned_to = ?, updated_at = NOW()
       ${newStatus === 'closed' ? ', closed_at = NOW()' : ''} WHERE id = ?`,
      [newStatus, req.user.id, ticketId]
    );

    await createNotification({
      userId: ticket.user_id,
      title: 'Support Ticket Update',
      message: `An admin has responded to your ticket: "${ticket.subject}"`,
      type: 'info',
      actionUrl: `/support/${ticket.uuid}`,
    });

    return successResponse(res, {}, 'Reply sent successfully');
  } catch (err) {
    logger.error('admin replyTicket error:', err);
    return errorResponse(res, 'Failed to reply to ticket', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS / BROADCAST
// ═══════════════════════════════════════════════════════════
const broadcast = async (req, res) => {
  const { title, message, type } = req.body;
  try {
    await broadcastNotification({ title, message, type: type || 'info' });

    await logAdminAction({
      adminId: req.user.id, action: 'BROADCAST_NOTIFICATION',
      metadata: { title, message }, ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Notification broadcast to all users');
  } catch (err) {
    logger.error('broadcast error:', err);
    return errorResponse(res, 'Failed to broadcast notification', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════════════
const getAnalytics = async (req, res) => {
  const { period = '30' } = req.query; // days
  try {
    const days = parseInt(period) || 30;

    const [dailyRevenue] = await pool.query(`
      SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0) AS revenue
      FROM deposits WHERE status='approved'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY date ORDER BY date ASC
    `, [days]);

    const [dailyUsers] = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS new_users
      FROM users WHERE role='user' AND deleted_at IS NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY date ORDER BY date ASC
    `, [days]);

    const [investmentTrends] = await pool.query(`
      SELECT DATE(i.created_at) AS date, COUNT(*) AS count, COALESCE(SUM(i.amount),0) AS volume,
             p.name AS plan_name
      FROM investments i JOIN plans p ON p.id = i.plan_id
      WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY date, p.id ORDER BY date ASC
    `, [days]);

    const [[topStats]] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(amount),0) FROM deposits WHERE status='approved' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS period_deposits,
        (SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE status='approved' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS period_withdrawals,
        (SELECT COUNT(*) FROM users WHERE role='user' AND deleted_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS period_signups,
        (SELECT COUNT(*) FROM investments WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS period_investments
    `, [days, days, days, days]);

    const [adminActivity] = await pool.query(`
      SELECT action, COUNT(*) AS count FROM admin_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action ORDER BY count DESC LIMIT 10
    `, [days]);

    return successResponse(res, {
      period_days: days,
      summary: topStats,
      charts: { daily_revenue: dailyRevenue, daily_users: dailyUsers, investment_trends: investmentTrends },
      admin_activity: adminActivity,
    });
  } catch (err) {
    logger.error('getAnalytics error:', err);
    return errorResponse(res, 'Failed to fetch analytics', 500);
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN LOGS
// ═══════════════════════════════════════════════════════════
const getAdminLogs = async (req, res) => {
  const { page, limit, offset, buildMeta } = paginate(req.query);
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM admin_logs');
    const [logs] = await pool.query(
      `SELECT l.*, u.first_name, u.last_name, u.email
       FROM admin_logs l JOIN users u ON u.id = l.admin_id
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return paginatedResponse(res, logs, buildMeta(total));
  } catch (err) {
    return errorResponse(res, 'Failed to fetch logs', 500);
  }
};

module.exports = {
  getAdminDashboard,
  getUsers, getUser, updateUser, deleteUser,
  getInvestments, updateInvestment,
  getDeposits, approveDeposit, rejectDeposit,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getAdminPlans, createPlan, updatePlan, deletePlan,
  getAdminTickets, getAdminTicket, replyAdminTicket,
  broadcast,
  getAnalytics,
  getAdminLogs,
};
