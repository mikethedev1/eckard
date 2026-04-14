const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

// ─── GET USER TRANSACTIONS ────────────────────────────────────────────────
const getUserTransactions = async (req, res) => {
  const userId = req.user.id;
  const { type, status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (type)   { where += ' AND type = ?';   params.push(type);   }
    if (status) { where += ' AND status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions ${where}`, params
    );

    const [transactions] = await pool.query(
      `SELECT uuid, type, amount, balance_before, balance_after,
              reference_type, description, status, created_at
       FROM transactions ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, transactions, buildMeta(total));
  } catch (err) {
    logger.error('getUserTransactions error:', err);
    return errorResponse(res, 'Failed to fetch transactions', 500);
  }
};

module.exports = { getUserTransactions };
