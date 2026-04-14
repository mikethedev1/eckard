const cron   = require('node-cron');
const pool   = require('../config/db');
const { createNotification } = require('../utils/notifications');
const logger = require('../utils/logger');

/**
 * Process matured investments:
 * Finds all active investments where end_date <= NOW()
 * Credits principal + profit back to user balance
 * Marks investment as completed
 * Logs transaction and sends notification
 */
const processMaturedInvestments = async () => {
  const connection = await pool.getConnection();
  try {
    logger.info('⏰ Cron: Checking for matured investments...');

    const [matured] = await connection.query(
      `SELECT i.*, p.name AS plan_name
       FROM investments i
       JOIN plans p ON p.id = i.plan_id
       WHERE i.status = 'active' AND i.end_date <= NOW()
       FOR UPDATE`
    );

    if (!matured.length) {
      logger.info('⏰ Cron: No matured investments found.');
      connection.release();
      return;
    }

    logger.info(`⏰ Cron: Processing ${matured.length} matured investment(s)...`);

    for (const investment of matured) {
      const innerConn = await pool.getConnection();
      try {
        await innerConn.beginTransaction();

        const [[user]] = await innerConn.query(
          'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
          [investment.user_id]
        );

        if (!user) {
          await innerConn.rollback();
          logger.warn(`⏰ Cron: User ${investment.user_id} not found for investment ${investment.id}`);
          continue;
        }

        const totalReturn = parseFloat(investment.total_return);
        const newBalance  = (parseFloat(user.balance) + totalReturn).toFixed(2);

        await innerConn.query(
          `UPDATE investments SET status='completed', completed_at=NOW() WHERE id=?`,
          [investment.id]
        );
        await innerConn.query(
          'UPDATE users SET balance = ? WHERE id = ?',
          [newBalance, user.id]
        );
        await innerConn.query(
          `INSERT INTO transactions
             (user_id, type, amount, balance_before, balance_after, reference_id, reference_type, description)
           VALUES (?, 'profit', ?, ?, ?, ?, 'investment', ?)`,
          [user.id, totalReturn, user.balance, newBalance, investment.id,
           `Investment matured: ${investment.plan_name} - Principal + Profit returned`]
        );

        await innerConn.commit();

        await createNotification({
          userId: user.id,
          title: '🎉 Investment Matured!',
          message: `Your ${investment.plan_name} investment has matured. $${totalReturn.toFixed(2)} has been credited to your balance.`,
          type: 'success',
          actionUrl: '/investments',
        });

        logger.info(`⏰ Cron: Investment #${investment.id} completed. $${totalReturn} credited to user #${user.id}`);
      } catch (err) {
        await innerConn.rollback();
        logger.error(`⏰ Cron: Failed to process investment #${investment.id}:`, err.message);
      } finally {
        innerConn.release();
      }
    }

    logger.info('⏰ Cron: Investment processing complete.');
  } catch (err) {
    logger.error('⏰ Cron: Fatal error during investment processing:', err.message);
  } finally {
    connection.release();
  }
};

/**
 * Clean up expired refresh tokens daily
 */
const cleanExpiredTokens = async () => {
  try {
    const [result] = await pool.query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      logger.info(`🧹 Cron: Cleaned ${result.affectedRows} expired refresh token(s).`);
    }
  } catch (err) {
    logger.error('🧹 Cron: Failed to clean tokens:', err.message);
  }
};

const startCronJobs = () => {
  // Process matured investments every hour
  const schedule = process.env.CRON_SCHEDULE || '0 * * * *';
  cron.schedule(schedule, processMaturedInvestments);
  logger.info(`⏰ Investment cron scheduled: ${schedule}`);

  // Clean expired tokens every day at midnight
  cron.schedule('0 0 * * *', cleanExpiredTokens);
  logger.info('🧹 Token cleanup cron scheduled: daily at midnight');

  // Run once on startup to catch any investments missed while server was down
  processMaturedInvestments();
};

module.exports = { startCronJobs };
