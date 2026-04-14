const express = require('express');
const router  = express.Router();

const { authenticate }   = require('../middlewares/authMiddleware');
const { requireRole }    = require('../middlewares/roleMiddleware');
const { validate,
  planSchema,
  adminEditUserSchema,
  rejectSchema,
  broadcastSchema,
  ticketMessageSchema } = require('../utils/validators');

const {
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
} = require('../controllers/adminController');


// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireRole('admin'));

// ─── Dashboard ────────────────────────────────────────────
router.get('/dashboard', getAdminDashboard);

// ─── Analytics ────────────────────────────────────────────
router.get('/analytics', getAnalytics);

// ─── Logs ─────────────────────────────────────────────────
router.get('/logs', getAdminLogs);

// ─── User Management ──────────────────────────────────────
router.get('/users',        getUsers);
router.get('/users/:id',    getUser);
router.put('/users/:id',    validate(adminEditUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

// ─── Investment Management ────────────────────────────────
router.get('/investments',      getInvestments);
router.put('/investments/:id',  updateInvestment);

// ─── Deposit Management ───────────────────────────────────
router.get('/deposits',                  getDeposits);
router.put('/deposits/:id/approve',      approveDeposit);
router.put('/deposits/:id/reject',       validate(rejectSchema), rejectDeposit);

// ─── Withdrawal Management ────────────────────────────────
router.get('/withdrawals',               getWithdrawals);
router.put('/withdrawals/:id/approve',   approveWithdrawal);
router.put('/withdrawals/:id/reject',    validate(rejectSchema), rejectWithdrawal);

// ─── Plan Management ──────────────────────────────────────
router.get('/plans',          getAdminPlans);
router.post('/plans',         validate(planSchema), createPlan);
router.put('/plans/:id',      validate(planSchema), updatePlan);
router.delete('/plans/:id',   deletePlan);

// ─── Support Management ───────────────────────────────────
router.get('/support',            getAdminTickets);
router.get('/support/:id',        getAdminTicket);
router.post('/support/:id/reply', validate(ticketMessageSchema), replyAdminTicket);

// ─── Notifications ────────────────────────────────────────
router.post('/broadcast', validate(broadcastSchema), broadcast);


const {
getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod
} = require('../controllers/paymentMethodController');
// Payment Methods (admin manages, users read)
router.get('/payment-methods',         getPaymentMethods);   // admin gets all
router.post('/payment-methods',        createPaymentMethod);
router.put('/payment-methods/:id',     updatePaymentMethod);
router.delete('/payment-methods/:id',  deletePaymentMethod);

module.exports = router;
