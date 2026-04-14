const express = require('express');
const router  = express.Router();

const { authenticate }          = require('../middlewares/authMiddleware');
const { requireRole }           = require('../middlewares/roleMiddleware');
const upload                    = require('../middlewares/uploadMiddleware');
const { validate,
  updateProfileSchema,
  createInvestmentSchema,
  createDepositSchema,
  createWithdrawalSchema,
  createTicketSchema,
  ticketMessageSchema }         = require('../utils/validators');

const { updateProfile, uploadAvatar, getDashboard } = require('../controllers/userController');
const { getPlans, createInvestment, getUserInvestments, getInvestment } = require('../controllers/investmentController');
const { createDeposit, getUserDeposits, getDeposit }    = require('../controllers/depositController');
const { createWithdrawal, getUserWithdrawals, getWithdrawal } = require('../controllers/withdrawalController');
const { getUserTransactions }   = require('../controllers/transactionController');
const { createTicket, getUserTickets, getTicket, replyToTicket } = require('../controllers/supportController');
const { getNotifications, markAllRead, markRead, getUnreadCount } = require('../controllers/notificationController');

// All user routes require authentication + user role
router.use(authenticate);
router.use(requireRole('user'));

// ─── Dashboard ────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ─── Profile ──────────────────────────────────────────────
router.put('/profile',           validate(updateProfileSchema), updateProfile);
router.post('/profile/avatar',   upload.single('avatar'), uploadAvatar);

// ─── Plans ────────────────────────────────────────────────
router.get('/plans', getPlans);

// ─── Investments ──────────────────────────────────────────
router.get('/investments',       getUserInvestments);
router.get('/investments/:uuid', getInvestment);
router.post('/investments',      validate(createInvestmentSchema), createInvestment);

// ─── Deposits ─────────────────────────────────────────────
router.get('/deposits',          getUserDeposits);
router.get('/deposits/:uuid',    getDeposit);
router.post('/deposits',         upload.single('proof_image'), validate(createDepositSchema), createDeposit);

// ─── Withdrawals ──────────────────────────────────────────
router.get('/withdrawals',       getUserWithdrawals);
router.get('/withdrawals/:uuid', getWithdrawal);
router.post('/withdrawals',      validate(createWithdrawalSchema), createWithdrawal);

// ─── Transactions ─────────────────────────────────────────
router.get('/transactions',      getUserTransactions);

// ─── Support ──────────────────────────────────────────────
router.get('/support',              getUserTickets);
router.get('/support/:uuid',        getTicket);
router.post('/support',             validate(createTicketSchema), createTicket);
router.post('/support/:uuid/reply', validate(ticketMessageSchema), replyToTicket);

// ─── Notifications ────────────────────────────────────────
router.get('/notifications',           getNotifications);
router.get('/notifications/unread',    getUnreadCount);
router.put('/notifications/read-all',  markAllRead);
router.put('/notifications/:id/read',  markRead);

module.exports = router;
