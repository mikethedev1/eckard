const Joi = require('joi');

// ─── Auth ──────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name:  Joi.string().min(2).max(100).required(),
  email:      Joi.string().email().lowercase().required(),
  phone:      Joi.string().max(30).optional().allow('', null),
  password:   Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required(),
  country:    Joi.string().max(100).optional().allow('', null),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required(),
});

// ─── Profile ───────────────────────────────────────────────────────────────
const updateProfileSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional(),
  last_name:  Joi.string().min(2).max(100).optional(),
  phone:      Joi.string().max(30).optional().allow('', null),
  country:    Joi.string().max(100).optional().allow('', null),
  address:    Joi.string().max(500).optional().allow('', null),
});

// ─── Investment ────────────────────────────────────────────────────────────
const createInvestmentSchema = Joi.object({
  plan_id: Joi.number().integer().positive().required(),
  amount:  Joi.number().positive().required(),
});

// ─── Deposit ───────────────────────────────────────────────────────────────
const createDepositSchema = Joi.object({
  amount:    Joi.number().positive().min(1).required(),
  method:    Joi.string().max(100).default('bank_transfer'),
  reference: Joi.string().max(200).optional().allow('', null),
  notes:     Joi.string().max(1000).optional().allow('', null),
});

// ─── Withdrawal ────────────────────────────────────────────────────────────
const createWithdrawalSchema = Joi.object({
  amount:  Joi.number().positive().min(1).required(),
  method:  Joi.string().max(100).default('bank_transfer'),
  account_details: Joi.object({
    bank_name:       Joi.string().optional(),
    account_number:  Joi.string().optional(),
    account_name:    Joi.string().optional(),
    routing_number:  Joi.string().optional(),
    wallet_address:  Joi.string().optional(),
    wallet_network:  Joi.string().optional(),
  }).required(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

// ─── Support Ticket ────────────────────────────────────────────────────────
const createTicketSchema = Joi.object({
  subject:  Joi.string().min(5).max(255).required(),
  message:  Joi.string().min(10).required(),
  priority: Joi.string().valid('low','medium','high','urgent').default('medium'),
});

const ticketMessageSchema = Joi.object({
  message: Joi.string().min(1).required(),
});

// ─── Admin: Plan ───────────────────────────────────────────────────────────
const planSchema = Joi.object({
  name:         Joi.string().min(2).max(150).required(),
  description:  Joi.string().max(2000).optional().allow('', null),
  min_amount:   Joi.number().positive().required(),
  max_amount:   Joi.number().positive().required(),
  roi_min:      Joi.number().min(0).max(100).required(),
  roi_max:      Joi.number().min(0).max(100).required(),
  duration_days:Joi.number().integer().positive().required(),
  features:     Joi.array().items(Joi.string()).optional(),
  is_active:    Joi.boolean().default(true),
});

// ─── Admin: Edit User ──────────────────────────────────────────────────────
const adminEditUserSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).optional(),
  last_name:  Joi.string().min(2).max(100).optional(),
  email:      Joi.string().email().lowercase().optional(),
  phone:      Joi.string().max(30).optional().allow('', null),
  balance:    Joi.number().min(0).optional(),
  role:       Joi.string().valid('user','admin').optional(),
  status:     Joi.string().valid('active','banned','suspended').optional(),
  country:    Joi.string().max(100).optional().allow('', null),
});

// ─── Admin: Reject ─────────────────────────────────────────────────────────
const rejectSchema = Joi.object({
  rejection_reason: Joi.string().min(5).max(1000).required(),
});

// ─── Admin: Broadcast ──────────────────────────────────────────────────────
const broadcastSchema = Joi.object({
  title:   Joi.string().min(2).max(255).required(),
  message: Joi.string().min(5).required(),
  type:    Joi.string().valid('info','success','warning','error').default('info'),
});

// ─── Validator middleware factory ──────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }
  req.body = value;
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  createInvestmentSchema,
  createDepositSchema,
  createWithdrawalSchema,
  createTicketSchema,
  ticketMessageSchema,
  planSchema,
  adminEditUserSchema,
  rejectSchema,
  broadcastSchema,
};
