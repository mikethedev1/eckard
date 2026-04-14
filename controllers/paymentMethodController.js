const pool   = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { logAdminAction, writeAudit }     = require('../utils/audit');
const logger = require('../utils/logger');

// ─── GET (public/user → active only | admin → all) ───────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const where   = isAdmin ? '' : 'WHERE is_active = 1';
    const [methods] = await pool.query(
      `SELECT * FROM payment_methods ${where} ORDER BY id ASC`
    );
    return successResponse(res, methods);
  } catch (err) {
    logger.error('getPaymentMethods error:', err);
    return errorResponse(res, 'Failed to fetch payment methods', 500);
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
const createPaymentMethod = async (req, res) => {
  const { name, type, icon, description, details, instructions, is_active } = req.body;
  try {
    // Validate details is parseable JSON
    let detailsStr;
    try {
      detailsStr = typeof details === 'object'
        ? JSON.stringify(details)
        : JSON.stringify(JSON.parse(details)); // normalise
    } catch {
      return errorResponse(res, 'Details must be valid JSON', 422);
    }

    const [result] = await pool.query( 
      `INSERT INTO payment_methods
         (name, type, icon, description, details, instructions, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        type || 'bank_transfer',
        icon || '💳',
        description || '',
        detailsStr,
        instructions || null,
        is_active !== false ? 1 : 0,
      ]
    );

    await logAdminAction({
      adminId:    req.user.id,
      action:     'CREATE_PAYMENT_METHOD',
      targetType: 'payment_method',
      targetId:   result.insertId,
      metadata:   { name, type },
      ipAddress:  req.ip,
    });

    await writeAudit({
      actionType:  'PAYMENT_METHOD_CREATED',
      performedBy: req.user.id,
      targetTable: 'payment_methods',
      targetId:    result.insertId,
      newValues:   { name, type, is_active },
      ipAddress:   req.ip,
    });

    const [[method]] = await pool.query(
      'SELECT * FROM payment_methods WHERE id = ?', [result.insertId]
    );
    return successResponse(res, method, 'Payment method created', 201);
  } catch (err) {
    logger.error('createPaymentMethod error:', err);
    return errorResponse(res, 'Failed to create payment method', 500);
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updatePaymentMethod = async (req, res) => {
  const { id } = req.params;
  const { name, type, icon, description, details, instructions, is_active } = req.body;

  try {
    const [[before]] = await pool.query(
      'SELECT * FROM payment_methods WHERE id = ?', [id]
    );
    if (!before) return errorResponse(res, 'Payment method not found', 404);

    let detailsStr = null;
    if (details !== undefined) {
      try {
        detailsStr = typeof details === 'object'
          ? JSON.stringify(details)
          : JSON.stringify(JSON.parse(details));
      } catch {
        return errorResponse(res, 'Details must be valid JSON', 422);
      }
    }

    await pool.query(
      `UPDATE payment_methods SET
         name         = COALESCE(?, name),
         type         = COALESCE(?, type),
         icon         = COALESCE(?, icon),
         description  = COALESCE(?, description),
         details      = COALESCE(?, details),
         instructions = COALESCE(?, instructions),
         is_active    = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name        ?? null,
        type        ?? null,
        icon        ?? null,
        description ?? null,
        detailsStr,
        instructions !== undefined ? instructions : null,
        is_active   !== undefined  ? (is_active ? 1 : 0) : null,
        id,
      ]
    );

    await logAdminAction({
      adminId:    req.user.id,
      action:     'UPDATE_PAYMENT_METHOD',
      targetType: 'payment_method',
      targetId:   id,
      metadata:   req.body,
      ipAddress:  req.ip,
    });

    await writeAudit({
      actionType:  'PAYMENT_METHOD_UPDATED',
      performedBy: req.user.id,
      targetTable: 'payment_methods',
      targetId:    id,
      oldValues:   before,
      newValues:   req.body,
      ipAddress:   req.ip,
    });

    const [[updated]] = await pool.query(
      'SELECT * FROM payment_methods WHERE id = ?', [id]
    );
    return successResponse(res, updated, 'Payment method updated');
  } catch (err) {
    logger.error('updatePaymentMethod error:', err);
    return errorResponse(res, 'Failed to update payment method', 500);
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deletePaymentMethod = async (req, res) => {
  const { id } = req.params;
  try {
    const [[method]] = await pool.query(
      'SELECT id, name FROM payment_methods WHERE id = ?', [id]
    );
    if (!method) return errorResponse(res, 'Payment method not found', 404);

    await pool.query('DELETE FROM payment_methods WHERE id = ?', [id]);

    await logAdminAction({
      adminId:    req.user.id,
      action:     'DELETE_PAYMENT_METHOD',
      targetType: 'payment_method',
      targetId:   id,
      metadata:   { name: method.name },
      ipAddress:  req.ip,
    });

    return successResponse(res, {}, 'Payment method deleted');
  } catch (err) {
    logger.error('deletePaymentMethod error:', err);
    return errorResponse(res, 'Failed to delete payment method', 500);
  }
};

module.exports = {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
