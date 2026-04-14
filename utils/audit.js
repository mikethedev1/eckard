const pool = require('../config/db');
const logger = require('./logger');

/**
 * Log an admin action to admin_logs table
 */
const logAdminAction = async ({ adminId, action, targetType, targetId, metadata, ipAddress }) => {
  try {
    await pool.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, metadata, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, action, targetType || null, targetId || null,
       metadata ? JSON.stringify(metadata) : null, ipAddress || null]
    );
  } catch (err) {
    logger.error('Failed to log admin action:', err.message);
  }
};

/**
 * Write an entry to the audit_trail table
 */
const writeAudit = async ({
  actionType,
  performedBy,
  targetTable,
  targetId,
  oldValues,
  newValues,
  metadata,
  ipAddress,
  userAgent,
}) => {
  try {
    await pool.query(
      `INSERT INTO audit_trail
         (action_type, performed_by, target_table, target_id, old_values, new_values, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actionType,
        performedBy,
        targetTable || null,
        targetId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        metadata  ? JSON.stringify(metadata)  : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } catch (err) {
    logger.error('Failed to write audit trail:', err.message);
  }
};

module.exports = { logAdminAction, writeAudit };
