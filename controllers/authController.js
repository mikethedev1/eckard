const bcrypt        = require('bcryptjs');
const jwt           = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool          = require('../config/db');
const { successResponse, errorResponse } = require('../utils/response');
const { writeAudit } = require('../utils/audit');
const logger        = require('../utils/logger');

// ─── Helper: generate tokens ──────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, uuid: user.uuid, role: user.role, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

  return { accessToken, refreshToken };
};

const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    secure: true,
  };
  res.cookie('access_token',  accessToken,  { ...cookieOpts, maxAge: 7  * 24 * 60 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { first_name, last_name, email, phone, password, country } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return errorResponse(res, 'An account with this email already exists', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, phone, password, country)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone || null, hashed, country || null]
    );

    await writeAudit({
      actionType: 'USER_REGISTER',
      performedBy: result.insertId,
      targetTable: 'users',
      targetId: result.insertId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const [users] = await pool.query(
      'SELECT id, uuid, email, first_name, last_name, role, balance, status FROM users WHERE id = ?',
      [result.insertId]
    );
    const user = users[0];
    const { accessToken, refreshToken } = generateTokens(user);

    // Persist refresh token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    setCookies(res, accessToken, refreshToken);

    return successResponse(res, { user, accessToken }, 'Account created successfully', 201);
  } catch (err) {
    logger.error('Register error:', err);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      `SELECT id, uuid, email, first_name, last_name, role, balance, status, password
       FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    );

    if (!rows.length) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const user = rows[0];

    if (user.status === 'banned') {
      return errorResponse(res, 'Your account has been suspended. Please contact support.', 403);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const { accessToken, refreshToken } = generateTokens(user);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, refreshToken, expiresAt]
    );

    await writeAudit({
      actionType: 'USER_LOGIN',
      performedBy: user.id,
      targetTable: 'users',
      targetId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setCookies(res, accessToken, refreshToken);

    const { password: _, ...safeUser } = user;
    return successResponse(res, { user: safeUser, accessToken }, 'Login successful');
  } catch (err) {
    logger.error('Login error:', err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refresh_token;
    if (!token) return errorResponse(res, 'Refresh token required', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (!rows.length) return errorResponse(res, 'Invalid or expired refresh token', 401);

    const [users] = await pool.query(
      'SELECT id, uuid, email, first_name, last_name, role, balance, status FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!users.length) return errorResponse(res, 'User not found', 401);

    const user = users[0];
    if (user.status === 'banned') return errorResponse(res, 'Account suspended', 403);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);

    // Rotate refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, newRefresh, expiresAt]
    );

    setCookies(res, accessToken, newRefresh);
    return successResponse(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    return errorResponse(res, 'Failed to refresh token', 401);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return successResponse(res, {}, 'Logged out successfully');
  } catch (err) {
    logger.error('Logout error:', err);
    return errorResponse(res, 'Logout failed', 500);
  }
};

// ─── GET CURRENT USER (me) ────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, uuid, first_name, last_name, email, phone, role, balance,
              status, avatar, country, address, kyc_status, last_login, created_at
       FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [req.user.id]
    );
    if (!rows.length) return errorResponse(res, 'User not found', 404);
    return successResponse(res, rows[0]);
  } catch (err) {
    logger.error('getMe error:', err);
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT password FROM users WHERE id = ?', [req.user.id]
    );
    const valid = await bcrypt.compare(current_password, rows[0].password);
    if (!valid) return errorResponse(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    await writeAudit({
      actionType: 'PASSWORD_CHANGED',
      performedBy: req.user.id,
      targetTable: 'users',
      targetId: req.user.id,
      ipAddress: req.ip,
    });

    return successResponse(res, {}, 'Password changed successfully');
  } catch (err) {
    logger.error('changePassword error:', err);
    return errorResponse(res, 'Failed to change password', 500);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, changePassword };
