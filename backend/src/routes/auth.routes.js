import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';
import { validateSignup, validateLogin } from '../middleware/validate.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Tight limiters on credential-submission endpoints to block brute-force attacks.
// GET /auth/me (session restore) is intentionally excluded — it uses the generous
// apiLimiter applied at the app level so normal page refreshes are never rejected.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many signup attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/signup
 * Register a new user
 * @access Public
 */
router.post('/signup', signupLimiter, validateSignup, authController.signup.bind(authController));

/**
 * POST /api/auth/login
 * User login
 * @access Public
 */
router.post('/login', loginLimiter, validateLogin, authController.login.bind(authController));

/**
 * GET /api/auth/me
 * Get currently authenticated user — session restore, not a credential submission.
 * Uses apiLimiter only (applied at app level); no extra throttle here.
 * @access Protected
 */
router.get('/me', auth, authController.getCurrentUser.bind(authController));

/**
 * POST /api/auth/forgot-password
 * Initiate password reset workflow
 * @access Public
 * @body {string} email - User's email address
 * @returns Always returns success response (prevents email enumeration)
 */
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword.bind(authController));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * @access Public
 * @body {string} token - Password reset token (from email link)
 * @body {string} password - New password (min 8 characters)
 */
router.post('/reset-password', passwordResetLimiter, authController.resetPassword.bind(authController));

export default router;
