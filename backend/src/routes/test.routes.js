import express from 'express';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';
import emailService from '../services/email.service.js';

const router = express.Router();

/**
 * Test Email Endpoint
 * 
 * WHY dev-only: Allows admins to test email configuration in development
 * without relying on actual user actions (signup, booking, etc.).
 * WHY admin-only: Prevents non-privileged users from sending arbitrary emails.
 * WHY no dependency on models: Keeps testing isolated from business logic.
 * 
 * @route POST /api/test/email
 * @access Protected - Admin only
 * @returns {Object} Success message with email details
 */
router.post('/email', auth, authorize('admin'), async (req, res, next) => {
  try {
    // Get admin's email from authenticated user
    const adminEmail = req.user.email;

    if (!adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Admin email not found in user profile'
      });
    }

    // Send test welcome email
    // WHY test with welcome email: It's a complete example with template loading and placeholder replacement
    const result = await emailService.sendWelcomeEmail(adminEmail, req.user.firstName || 'Admin');

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        to: adminEmail,
        subject: 'Welcome to Lumière — Your Private Chef Marketplace',
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Email errors should not crash the server
    console.error(`❌ Test Email Endpoint Error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

export default router;
