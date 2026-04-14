const pool = require('../config/db');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

// ─── CREATE TICKET ────────────────────────────────────────────────────────
const createTicket = async (req, res) => {
  const { subject, message, priority } = req.body;
  const userId = req.user.id;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [ticketResult] = await connection.query(
      `INSERT INTO support_tickets (user_id, subject, priority) VALUES (?, ?, ?)`,
      [userId, subject, priority || 'medium']
    );

    await connection.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message, is_admin) VALUES (?, ?, ?, 0)`,
      [ticketResult.insertId, userId, message]
    );

    await connection.commit();

    const [[ticket]] = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) AS message_count
       FROM support_tickets t WHERE t.id = ?`,
      [ticketResult.insertId]
    );

    return successResponse(res, ticket, 'Support ticket created successfully', 201);
  } catch (err) {
    await connection.rollback();
    logger.error('createTicket error:', err);
    return errorResponse(res, 'Failed to create support ticket', 500);
  } finally {
    connection.release();
  }
};

// ─── GET USER TICKETS ─────────────────────────────────────────────────────
const getUserTickets = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;
  const { page, limit, offset, buildMeta } = paginate(req.query);

  try {
    let where = 'WHERE t.user_id = ?';
    const params = [userId];
    if (status) { where += ' AND t.status = ?'; params.push(status); }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM support_tickets t ${where}`, params
    );

    const [tickets] = await pool.query(
      `SELECT t.uuid, t.subject, t.priority, t.status, t.created_at, t.updated_at,
              (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) AS message_count,
              (SELECT created_at FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) AS last_reply
       FROM support_tickets t ${where}
       ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return paginatedResponse(res, tickets, buildMeta(total));
  } catch (err) {
    logger.error('getUserTickets error:', err);
    return errorResponse(res, 'Failed to fetch tickets', 500);
  }
};

// ─── GET TICKET DETAIL + MESSAGES ────────────────────────────────────────
const getTicket = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[ticket]] = await pool.query(
      `SELECT t.* FROM support_tickets t WHERE t.uuid = ? AND t.user_id = ?`,
      [req.params.uuid, userId]
    );
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);

    const [messages] = await pool.query(
      `SELECT m.id, m.message, m.is_admin, m.created_at,
              u.first_name, u.last_name, u.avatar
       FROM ticket_messages m JOIN users u ON u.id = m.sender_id
       WHERE m.ticket_id = ?
       ORDER BY m.created_at ASC`,
      [ticket.id]
    );

    return successResponse(res, { ticket, messages });
  } catch (err) {
    logger.error('getTicket error:', err);
    return errorResponse(res, 'Failed to fetch ticket', 500);
  }
};

// ─── REPLY TO TICKET ──────────────────────────────────────────────────────
const replyToTicket = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;
  try {
    const [[ticket]] = await pool.query(
      `SELECT id, status FROM support_tickets WHERE uuid = ? AND user_id = ?`,
      [req.params.uuid, userId]
    );
    if (!ticket) return errorResponse(res, 'Ticket not found', 404);
    if (ticket.status === 'closed') {
      return errorResponse(res, 'This ticket is closed. Please open a new ticket.', 400);
    }

    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message, is_admin) VALUES (?, ?, ?, 0)`,
      [ticket.id, userId, message]
    );
    await pool.query(
      `UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = ?`,
      [ticket.id]
    );

    return successResponse(res, {}, 'Reply sent successfully');
  } catch (err) {
    logger.error('replyToTicket error:', err);
    return errorResponse(res, 'Failed to send reply', 500);
  }
};

module.exports = { createTicket, getUserTickets, getTicket, replyToTicket };
