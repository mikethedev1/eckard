const express = require('express');
const router  = express.Router();

const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} = require('../controllers/paymentMethodController');

const { authenticate }  = require('../middlewares/authMiddleware');
const { requireRole }   = require('../middlewares/roleMiddleware');

// ─── Public / Authenticated ───────────────────────────────────────────────────
// GET  /api/payment-methods  → active only for users, all for admins
router.get('/', authenticate, getPaymentMethods);

// ─── Admin-only ───────────────────────────────────────────────────────────────
// POST   /api/payment-methods
router.post('/',      authenticate, requireRole('admin'), createPaymentMethod);

// PUT    /api/payment-methods/:id
router.put('/:id',    authenticate, requireRole('admin'), updatePaymentMethod);

// DELETE /api/payment-methods/:id
router.delete('/:id', authenticate, requireRole('admin'), deletePaymentMethod);

module.exports = router;