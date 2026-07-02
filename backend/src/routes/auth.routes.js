import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validateSignup, validateLogin } from '../middleware/validate.js';
import auth from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 * @access Public
 */
router.post('/signup', validateSignup, authController.signup.bind(authController));

/**
 * POST /api/auth/login
 * User login
 * @access Public
 */
router.post('/login', validateLogin, authController.login.bind(authController));

/**
 * GET /api/auth/me
 * Get currently authenticated user
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
router.post('/forgot-password', authController.forgotPassword.bind(authController));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * @access Public
 * @body {string} token - Password reset token (from email link)
 * @body {string} password - New password (min 8 characters)
 */
router.post('/reset-password', authController.resetPassword.bind(authController));

export default router;
