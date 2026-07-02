import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

/**
 * Email Service
 * 
 * Encapsulates all email functionality using Nodemailer.
 * All other services and controllers should call methods in this service
 * rather than interacting with Nodemailer directly.
 * 
 * WHY centralize email logic: Prevents duplicate SMTP code, ensures consistent
 * error handling, and makes it easy to swap email providers in the future.
 * WHY single transporter instance: Nodemailer reuses SMTP connections for
 * efficiency; creating multiple transporters wastes resources.
 * WHY validate env variables on startup: Catches configuration errors early
 * rather than at runtime when first email is sent.
 * WHY template placeholders instead of Handlebars: Keeps the MVP lightweight
 * and avoids unnecessary dependencies for simple replacements.
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.templateCache = {};
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter with SMTP configuration
   * WHY initialization in constructor: Ensures transporter is ready before
   * any email is sent; validates env variables early.
   * @throws {Error} If required SMTP configuration is missing
   * @private
   */
  initializeTransporter() {
    // Read SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM;

    // Validate required configuration
    const missingVars = [];
    if (!smtpHost) missingVars.push('SMTP_HOST');
    if (!smtpPort) missingVars.push('SMTP_PORT');
    if (!smtpUser) missingVars.push('SMTP_USER');
    if (!smtpPass) missingVars.push('SMTP_PASS');
    if (!emailFrom) missingVars.push('EMAIL_FROM');

    if (missingVars.length > 0) {
      const errorMsg = `Missing required email configuration: ${missingVars.join(', ')}. Please set these environment variables.`;
      console.error(`❌ EmailService: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Create Nodemailer transporter
    // WHY reuse single transporter: SMTP connection pooling improves performance
    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465, // Use TLS for port 465
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      console.log('✅ EmailService: Transporter initialized successfully');
    } catch (error) {
      const errorMsg = `Failed to initialize email transporter: ${error.message}`;
      console.error(`❌ EmailService: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Generic email sending method
   * WHY single method: Centralizes SMTP logic and error handling.
   * All future email methods (sendWelcomeEmail, sendBookingConfirmation, etc.)
   * call this internally without duplicating transporter code.
   * WHY support both HTML and text: Ensures compatibility with all email clients;
   * text version serves as fallback for clients that don't render HTML.
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject line
   * @param {string} text - Plain text email body
   * @param {string} html - HTML email body (optional; if not provided, uses text as fallback)
   * @returns {Promise<Object>} Nodemailer response with messageId
   * @throws {Error} If email sending fails
   */
  async sendEmail({ to, subject, text, html = null }) {
    try {
      // Validate required parameters
      if (!to || !subject || !text) {
        throw new Error('Missing required email parameters: to, subject, text');
      }

      // Ensure transporter is initialized
      if (!this.transporter) {
        throw new Error('Email transporter not initialized. Check SMTP configuration.');
      }

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
      };

      // Add HTML version if provided
      if (html) {
        mailOptions.html = html;
      }

      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email sent: ${to} (Subject: ${subject}, MessageID: ${result.messageId})`);
      return result;
    } catch (error) {
      const errorMsg = `Failed to send email to ${to}: ${error.message}`;
      console.error(`❌ EmailService: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Load an email template from disk
   * WHY cache templates: Avoids reading files on every email send.
   * Improves performance and reduces disk I/O.
   * @param {string} templateName - Name of template file (without .html extension)
   * @returns {string} Template content
   * @throws {Error} If template file not found
   * @private
   */
  loadTemplate(templateName) {
    try {
      // Check cache first
      if (this.templateCache[templateName]) {
        return this.templateCache[templateName];
      }

      // Load template from disk
      const templatePath = resolve(__dirname, `../emails/${templateName}.html`);
      const template = readFileSync(templatePath, 'utf-8');

      // Cache for future use
      this.templateCache[templateName] = template;

      return template;
    } catch (error) {
      const errorMsg = `Failed to load email template "${templateName}": ${error.message}`;
      console.error(`❌ EmailService: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  /**
   * Replace placeholders in template with supplied values
   * WHY simple string replacement: Sufficient for MVP; avoids Handlebars dependency.
   * Placeholders use {{name}} syntax (e.g., {{firstName}}, {{resetLink}})
   * WHY case-sensitive: Keeps template authoring straightforward.
   * @param {string} template - Template string with {{placeholder}} syntax
   * @param {Object} values - Key-value pairs to replace placeholders
   * @returns {string} Template with placeholders replaced
   * @example
   * const template = 'Hello {{firstName}}, welcome!';
   * const result = replacePlaceholders(template, { firstName: 'Alice' });
   * // result: 'Hello Alice, welcome!'
   * @private
   */
  replacePlaceholders(template, values = {}) {
    let result = template;

    // Replace each placeholder with corresponding value
    Object.keys(values).forEach((key) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, values[key]);
    });

    return result;
  }

  /**
   * Send welcome email
   * Called when a new user signs up.
   * WHY separate method: Makes intent clear; centralizes welcome email configuration.
   * Future changes to welcome email only need to happen here.
   * @param {string} email - Recipient email address
   * @param {string} firstName - Recipient's first name
   * @param {string} role - User role (client, chef, admin)
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendWelcomeEmail(email, firstName, role = 'client') {
    try {
      // Load and prepare template
      const template = this.loadTemplate('welcome');

      // Role-specific content
      const roleContent = this._getRoleSpecificContent(role);

      // Replace placeholders
      const html = this.replacePlaceholders(template, {
        name: firstName || 'there',
        role: this._formatRole(role),
        roleContent,
      });

      // Send email using generic method
      return await this.sendEmail({
        to: email,
        subject: 'Welcome to Lumière — Your Private Chef Marketplace',
        text: `Welcome to Lumière, ${firstName || 'there'}! We're excited to have you on board.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * Called when a user requests password reset.
   * WHY separate method: Keeps password reset logic isolated and secure.
   * @param {string} email - Recipient email address
   * @param {string} firstName - Recipient's first name
   * @param {string} resetLink - Full reset link (includes token)
   * @param {number} expirationMinutes - How many minutes until token expires
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendPasswordReset(email, firstName, resetLink, expirationMinutes = 30) {
    try {
      // Load and prepare template
      const template = this.loadTemplate('password-reset');

      // Replace placeholders
      const html = this.replacePlaceholders(template, {
        name: firstName || 'User',
        resetLink,
        expiresIn: `${expirationMinutes} minutes`,
      });

      // Send email using generic method
      return await this.sendEmail({
        to: email,
        subject: 'Lumière — Reset Your Password',
        text: `Hi ${firstName || 'User'},\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link expires in ${expirationMinutes} minutes.\n\nIf you didn't request this, ignore this email.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Format role for display in email
   * @private
   * @param {string} role - User role (client, chef, admin)
   * @returns {string} Formatted role for display
   */
  _formatRole(role) {
    const roleMap = {
      client: 'Food Lover',
      chef: 'Chef',
      admin: 'Administrator',
    };
    return roleMap[role] || 'User';
  }

  /**
   * Get role-specific content HTML for welcome email
   * WHY separate method: Keeps welcome email template clean and maintainable.
   * Different roles have different next steps.
   * @private
   * @param {string} role - User role
   * @returns {string} HTML content specific to role
   */
  _getRoleSpecificContent(role) {
    const roleContent = {
      client: `
        <div class="role-specific">
          <h3>What You Can Do:</h3>
          <ul>
            <li><strong>Discover Chefs:</strong> Browse verified private chefs in your area with their specialties and menus</li>
            <li><strong>Book Experiences:</strong> Reserve a chef for dinners, events, or cooking lessons</li>
            <li><strong>Manage Bookings:</strong> Track your reservations and communicate directly with chefs</li>
            <li><strong>Leave Reviews:</strong> Share your experience and help other food lovers find great chefs</li>
          </ul>
        </div>
      `,
      chef: `
        <div class="role-specific">
          <h3>Next Steps for Chefs:</h3>
          <ul>
            <li><strong>Complete Your Profile:</strong> Add your bio, specialties, cuisines, and service areas</li>
            <li><strong>Upload Gallery:</strong> Showcase your best dishes with high-quality photos</li>
            <li><strong>Set Up Menus:</strong> Create custom menus and pricing for your services</li>
            <li><strong>Get Verified:</strong> Submit your credentials and certifications for verification</li>
            <li><strong>Start Earning:</strong> Accept bookings and build your clientele</li>
          </ul>
        </div>
      `,
      admin: `
        <div class="role-specific">
          <h3>Admin Dashboard:</h3>
          <ul>
            <li><strong>User Management:</strong> Monitor and manage all platform users</li>
            <li><strong>Chef Verification:</strong> Review and approve chef applications</li>
            <li><strong>Booking Oversight:</strong> View all bookings and manage disputes</li>
            <li><strong>Payment Management:</strong> Track transactions and payouts</li>
            <li><strong>Platform Analytics:</strong> Review platform statistics and trends</li>
          </ul>
        </div>
      `,
    };

    return roleContent[role] || roleContent.client;
  }

  /**
   * Send booking confirmation email
   * Called when a booking is created or confirmed.
   * WHY placeholder method: Demonstrates extensibility pattern.
   * Will be fully implemented in Phase 15B.
   * @param {string} email - Recipient email address
   * @param {Object} bookingDetails - Booking information
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingConfirmation(email, bookingDetails) {
    try {
      // Template loading and placeholder replacement will happen here
      // For now, this is a placeholder for Phase 15B implementation
      throw new Error('sendBookingConfirmation not yet implemented');
    } catch (error) {
      throw new Error(`Failed to send booking confirmation: ${error.message}`);
    }
  }

  /**
   * Send booking cancellation email
   * Called when a booking is cancelled.
   * WHY placeholder method: Demonstrates extensibility pattern.
   * Will be fully implemented in Phase 15B.
   * @param {string} email - Recipient email address
   * @param {Object} bookingDetails - Booking information
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingCancelled(email, bookingDetails) {
    try {
      // Template loading and placeholder replacement will happen here
      // For now, this is a placeholder for Phase 15B implementation
      throw new Error('sendBookingCancelled not yet implemented');
    } catch (error) {
      throw new Error(`Failed to send booking cancellation email: ${error.message}`);
    }
  }

  /**
   * Send payment receipt email
   * Called when a payment is successfully processed.
   * WHY placeholder method: Demonstrates extensibility pattern.
   * Will be fully implemented in Phase 15C.
   * @param {string} email - Recipient email address
   * @param {Object} paymentDetails - Payment information
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendPaymentReceipt(email, paymentDetails) {
    try {
      // Template loading and placeholder replacement will happen here
      // For now, this is a placeholder for Phase 15C implementation
      throw new Error('sendPaymentReceipt not yet implemented');
    } catch (error) {
      throw new Error(`Failed to send payment receipt: ${error.message}`);
    }
  }

  /**
   * Send chef verification email
   * Called when a chef profile is verified by admin.
   * WHY placeholder method: Demonstrates extensibility pattern.
   * Will be fully implemented in Phase 15D.
   * @param {string} email - Recipient email address
   * @param {string} chefName - Chef's name
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendChefVerifiedEmail(email, chefName) {
    try {
      // Template loading and placeholder replacement will happen here
      // For now, this is a placeholder for Phase 15D implementation
      throw new Error('sendChefVerifiedEmail not yet implemented');
    } catch (error) {
      throw new Error(`Failed to send chef verification email: ${error.message}`);
    }
  }
}

// Create singleton instance to ensure only one transporter is used
const emailService = new EmailService();

export default emailService;
