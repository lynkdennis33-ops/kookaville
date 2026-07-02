import authService from '../services/auth.service.js';
import emailService from '../services/email.service.js';

class AuthController {
  async signup(req, res, next) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const result = await authService.registerUser({
        firstName,
        lastName,
        email,
        password,
      });

      // Send welcome email asynchronously (non-blocking)
      // WHY non-blocking: Email delivery is not critical for successful registration
      // User gets successful response immediately; email failure doesn't affect signup
      try {
        const userRole = result.user.role || 'client';
        await emailService.sendWelcomeEmail(
          result.user.email,
          result.user.firstName,
          userRole
        );
      } catch (emailError) {
        // Log error but don't fail the request
        console.error(`❌ AuthController: Failed to send welcome email to ${result.user.email}: ${emailError.message}`);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      error.statusCode = error.message === 'Email already registered' ? 400 : 500;
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      error.statusCode = 401;
      next(error);
    }
  }

  // Get currently authenticated user
  async getCurrentUser(req, res, next) {
    try {
      // User is already attached to req.user by auth middleware
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate password reset workflow
   * @route POST /api/auth/forgot-password
   * @access Public
   * @param {string} email - User's email address
   * @returns {Object} Always returns success response (prevents email enumeration)
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      // Validate email format
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Get frontend URL from env or request
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Call service (always returns success response)
      const result = await authService.forgotPassword(email.toLowerCase(), frontendUrl);

      res.status(200).json(result);
    } catch (error) {
      // Even on error, return generic success response
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent',
      });
    }
  }

  /**
   * Reset password with token
   * @route POST /api/auth/reset-password
   * @access Public
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Object} User data and auth token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      // Validate required fields
      if (!token || !token.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Reset token is required',
        });
      }

      if (!password || !password.trim()) {
        return res.status(400).json({
          success: false,
          message: 'New password is required',
        });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }

      // Call service to reset password
      const result = await authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      // Determine error type
      let statusCode = 400;
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        statusCode = 400;
      }

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  }
}

export default new AuthController();
