const express = require('express');
const router  = express.Router();
const {
  register, login, refreshToken, logout, getMe, changePassword
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, registerSchema, loginSchema, changePasswordSchema } = require('../utils/validators');

// Public
router.post('/register', validate(registerSchema), register);
router.post('/login',    validate(loginSchema),    login);
router.post('/refresh',  refreshToken);

// Protected
router.use(authenticate);
router.get('/me',              getMe);
router.post('/logout',         logout);
router.put('/change-password', validate(changePasswordSchema), changePassword);

module.exports = router;
