import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import emailService from './email.service.js';
import { generateResetToken, hashResetToken, verifyResetToken } from '../utils/tokenHash.js';

class AuthService {
  async registerUser(userData) {
    const { firstName, lastName, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  async loginUser(email, password) {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user._id);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Initiate password reset workflow
   * WHY always success response: Prevents email enumeration attacks.
   * Attackers cannot determine which emails exist in the system.
   * WHY async email send: Email delivery is not critical for response; logging failures is sufficient.
   * @param {string} email - Email address requesting password reset
   * @param {string} frontendUrl - Frontend base URL for reset link (e.g., https://lumiere.app)
   * @returns {Promise<Object>} Always returns success response
   */
  async forgotPassword(email, frontendUrl) {
    try {
      // Find user by email (if exists)
      const user = await User.findOne({ email: email.toLowerCase() });

      // Always return success, whether email exists or not
      // This prevents email enumeration attacks
      const response = {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent',
      };

      // If user doesn't exist, return early (still success response)
      if (!user) {
        return response;
      }

      // Generate reset token (plain text)
      const resetToken = generateResetToken(32);

      // Hash token before storing (never store plain text tokens)
      // WHY hash: Protects users if database is compromised
      const hashedToken = hashResetToken(resetToken);

      // Set expiration (15-30 minutes from now; using 30 by default)
      const expirationMinutes = 30;
      const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);

      // Store hashed token and expiration in database
      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = expirationTime;
      await user.save({ validateBeforeSave: false });

      // Build reset link
      // WHY plain token in URL: User needs token to reset password; storing hash in DB prevents database compromise
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

      // Send password reset email asynchronously (non-blocking)
      // WHY try-catch: Email failures should not interrupt the user experience
      // Users can still manually request password reset if email fails
      try {
        await emailService.sendPasswordReset(
          user.email,
          user.firstName,
          resetLink,
          expirationMinutes
        );
      } catch (emailError) {
        // Log error but don't throw; API already returned success
        console.error(`❌ AuthService: Failed to send password reset email to ${user.email}: ${emailError.message}`);
      }

      return response;
    } catch (error) {
      // Log error but return success response
      console.error(`❌ AuthService: Unexpected error in forgotPassword: ${error.message}`);
      return {
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent',
      };
    }
  }

  /**
   * Reset user password with token
   * WHY hashing the token: Prevents token reuse if database is compromised
   * Even if attacker has database access, they cannot use tokens without knowing preimage
   * @param {string} token - Reset token provided by user
   * @param {string} newPassword - New password (will be hashed by pre-save hook)
   * @returns {Promise<Object>} User data after password reset
   * @throws {Error} If token invalid, expired, or password reset fails
   */
  async resetPassword(token, newPassword) {
    // Hash the supplied token to look up in database
    const hashedToken = hashResetToken(token);

    // Find user with matching token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Token must not be expired
    });

    if (!user) {
      throw new Error('Password reset token is invalid or has expired');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;

    // Clear reset token and expiration (prevent reuse)
    // WHY clear immediately: Ensures token can only be used once
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Save user with new password
    await user.save();

    // Generate new JWT token for immediate login (optional; user can login manually)
    const authToken = generateToken(user._id);

    return {
      user: user.toJSON(),
      token: authToken,
    };
  }
}

export default new AuthService();
