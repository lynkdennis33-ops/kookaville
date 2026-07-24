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

    // For production, throw an error if any required env vars are missing
    // if (missingVars.length > 0) {
    //   const errorMsg = `Missing required email configuration: ${missingVars.join(', ')}. Please set these environment variables.`;
    //   console.error(`❌ EmailService: ${errorMsg}`);
    //   throw new Error(errorMsg);
    // }

    //For development, we can log a warning instead of throwing an error to allow the app to run without email functionality.
    if (missingVars.length > 0) {
  console.warn(
    `⚠️ EmailService disabled. Missing configuration: ${missingVars.join(", ")}`
  );

  this.transporter = null;
  this.emailFrom = null;

  return;
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

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 15C — Booking Emails
  // All four status-transition emails share a single HTML template
  // (booking.html). The private _buildBookingEmailHtml() method handles
  // template loading and placeholder substitution so every public method
  // stays lean and avoids duplicating HTML.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build the HTML body for a booking email
   * WHY private helper: Centralises template loading and placeholder
   * replacement so all four booking email methods share one layout with
   * no duplicated HTML.
   * @param {Object} data
   * @param {string} data.recipientName      - First name of the recipient
   * @param {string} data.chefName           - Chef's full name
   * @param {string} data.bookingId          - Booking ID (last-8 chars displayed)
   * @param {string} data.eventDate          - Human-readable event date
   * @param {string} data.eventTime          - Event time string (HH:mm)
   * @param {number|string} data.guests      - Number of guests
   * @param {string} data.location           - Event location
   * @param {string} data.statusLabel        - Display label (e.g. "Pending")
   * @param {string} data.statusBadgeColor   - CSS hex colour for the status banner
   * @param {string} data.statusHeadline     - Banner headline text
   * @param {string} data.statusMessage      - Banner sub-message text
   * @param {string} data.statusNote         - Optional extra HTML block
   * @param {string} data.totalAmount        - Formatted total (e.g. "$250.00")
   * @returns {string} Populated HTML string
   * @private
   */
  _buildBookingEmailHtml(data) {
    const template = this.loadTemplate('booking');

    return this.replacePlaceholders(template, {
      recipientName:    data.recipientName   || 'there',
      chefName:         data.chefName        || 'Your Chef',
      bookingId:        data.bookingId       || '—',
      eventDate:        data.eventDate       || '—',
      eventTime:        data.eventTime       || '—',
      guests:           String(data.guests   ?? '—'),
      location:         data.location        || 'Not specified',
      statusLabel:      data.statusLabel     || '—',
      statusBadgeColor: data.statusBadgeColor || '#667eea',
      statusHeadline:   data.statusHeadline  || 'Booking Update',
      statusMessage:    data.statusMessage   || '',
      statusNote:       data.statusNote      || '',
      totalAmount:      data.totalAmount     || '—',
      frontendUrl:      process.env.FRONTEND_URL || 'https://kookaville.app',
    });
  }

  /**
   * Send booking-created email
   * Called after a new booking is persisted.
   * Sent to BOTH the client (confirmation) and the chef (new request alert).
   * The message wording adapts based on recipientRole.
   * @param {string} recipientEmail       - Recipient's email address
   * @param {string} recipientFirstName   - Recipient's first name
   * @param {Object} bookingData          - Booking details object
   * @param {string} bookingData.bookingId
   * @param {string} bookingData.chefName
   * @param {string} bookingData.clientName
   * @param {string} bookingData.eventDate
   * @param {string} bookingData.eventTime
   * @param {number} bookingData.guests
   * @param {string} bookingData.location
   * @param {string} bookingData.totalAmount
   * @param {'client'|'chef'} recipientRole - Controls message wording
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingCreatedEmail(recipientEmail, recipientFirstName, bookingData, recipientRole = 'client') {
    try {
      // Wording differs depending on whether the recipient submitted or received the request
      const isChef = recipientRole === 'chef';
      const otherParty = isChef ? bookingData.clientName : bookingData.chefName;

      const statusMessage = isChef
        ? `You have received a new booking request from ${otherParty}.`
        : `Your booking request has been sent to ${otherParty} and is awaiting confirmation.`;

      const statusNote = isChef
        ? `<div class="status-note">Please review the request and accept or decline from your chef portal within a reasonable time.</div>`
        : `<div class="status-note">We will notify you by email as soon as ${bookingData.chefName} responds to your request. You can also track the status from your dashboard.</div>`;

      const html = this._buildBookingEmailHtml({
        recipientName:    recipientFirstName,
        chefName:         bookingData.chefName,
        bookingId:        bookingData.bookingId,
        eventDate:        bookingData.eventDate,
        eventTime:        bookingData.eventTime,
        guests:           bookingData.guests,
        location:         bookingData.location,
        statusLabel:      'Pending',
        statusBadgeColor: '#f59e0b',   // amber — awaiting response
        statusHeadline:   isChef ? 'New Booking Request' : 'Booking Request Submitted',
        statusMessage,
        statusNote,
        totalAmount:      bookingData.totalAmount,
      });

      const subjectPrefix = isChef ? 'New Booking Request' : 'Booking Request Submitted';

      return await this.sendEmail({
        to:      recipientEmail,
        subject: `Kookaville — ${subjectPrefix}`,
        text:    `Hi ${recipientFirstName}, ${statusMessage} Booking ID: ${bookingData.bookingId}.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send booking-created email: ${error.message}`);
    }
  }

  /**
   * Send booking-accepted email
   * Called after a chef accepts a pending booking.
   * Sent ONLY to the client.
   * @param {string} clientEmail      - Client's email address
   * @param {string} clientFirstName  - Client's first name
   * @param {Object} bookingData      - Booking details object (see sendBookingCreatedEmail)
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingAcceptedEmail(clientEmail, clientFirstName, bookingData) {
    try {
      const statusMessage = `Great news! ${bookingData.chefName} has accepted your booking. Your event is confirmed.`;

      const statusNote = `<div class="status-note">Your booking is now confirmed. If you need to make changes or have questions, please contact the chef through your dashboard.</div>`;

      const html = this._buildBookingEmailHtml({
        recipientName:    clientFirstName,
        chefName:         bookingData.chefName,
        bookingId:        bookingData.bookingId,
        eventDate:        bookingData.eventDate,
        eventTime:        bookingData.eventTime,
        guests:           bookingData.guests,
        location:         bookingData.location,
        statusLabel:      'Accepted',
        statusBadgeColor: '#10b981',   // green — confirmed
        statusHeadline:   'Booking Confirmed! 🎉',
        statusMessage,
        statusNote,
        totalAmount:      bookingData.totalAmount,
      });

      return await this.sendEmail({
        to:      clientEmail,
        subject: 'Kookaville — Your Booking is Confirmed',
        text:    `Hi ${clientFirstName}, ${statusMessage} Booking ID: ${bookingData.bookingId}.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send booking-accepted email: ${error.message}`);
    }
  }

  /**
   * Send booking-rejected email
   * Called after a chef declines a pending booking.
   * Sent ONLY to the client.
   * @param {string} clientEmail      - Client's email address
   * @param {string} clientFirstName  - Client's first name
   * @param {Object} bookingData      - Booking details object
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingRejectedEmail(clientEmail, clientFirstName, bookingData) {
    try {
      const statusMessage = `We're sorry, ${bookingData.chefName} is unable to accept your booking request at this time.`;

      const statusNote = `<div class="status-note">Don't worry — you can search for other available chefs and submit a new request from your dashboard.</div>`;

      const html = this._buildBookingEmailHtml({
        recipientName:    clientFirstName,
        chefName:         bookingData.chefName,
        bookingId:        bookingData.bookingId,
        eventDate:        bookingData.eventDate,
        eventTime:        bookingData.eventTime,
        guests:           bookingData.guests,
        location:         bookingData.location,
        statusLabel:      'Rejected',
        statusBadgeColor: '#ef4444',   // red — declined
        statusHeadline:   'Booking Not Accepted',
        statusMessage,
        statusNote,
        totalAmount:      bookingData.totalAmount,
      });

      return await this.sendEmail({
        to:      clientEmail,
        subject: 'Kookaville — Booking Update',
        text:    `Hi ${clientFirstName}, ${statusMessage} Booking ID: ${bookingData.bookingId}.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send booking-rejected email: ${error.message}`);
    }
  }

  /**
   * Send booking-cancelled email
   * Called after a booking is cancelled.
   * Routing logic (who receives the email) is handled in booking.service.js:
   *   - Cancelled by client → notify the chef
   *   - Cancelled by chef   → notify the client
   * @param {string} recipientEmail       - Recipient's email address
   * @param {string} recipientFirstName   - Recipient's first name
   * @param {Object} bookingData          - Booking details object
   * @param {'client'|'chef'} cancelledBy - Who initiated the cancellation
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingCancelledEmail(recipientEmail, recipientFirstName, bookingData, cancelledBy = 'client') {
    try {
      // Message wording depends on who cancelled
      const statusMessage = cancelledBy === 'chef'
        ? `We regret to inform you that ${bookingData.chefName} has cancelled this booking.`
        : `The client has cancelled this booking.`;

      const statusNote = cancelledBy === 'chef'
        ? `<div class="status-note">We apologise for the inconvenience. You can search for other available chefs from your dashboard.</div>`
        : `<div class="status-note">If you have any questions regarding this cancellation, please contact support.</div>`;

      const html = this._buildBookingEmailHtml({
        recipientName:    recipientFirstName,
        chefName:         bookingData.chefName,
        bookingId:        bookingData.bookingId,
        eventDate:        bookingData.eventDate,
        eventTime:        bookingData.eventTime,
        guests:           bookingData.guests,
        location:         bookingData.location,
        statusLabel:      'Cancelled',
        statusBadgeColor: '#6b7280',   // gray — cancelled
        statusHeadline:   'Booking Cancelled',
        statusMessage,
        statusNote,
        totalAmount:      bookingData.totalAmount,
      });

      return await this.sendEmail({
        to:      recipientEmail,
        subject: 'Kookaville — Booking Cancelled',
        text:    `Hi ${recipientFirstName}, ${statusMessage} Booking ID: ${bookingData.bookingId}.`,
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send booking-cancelled email: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 15D — Payment Emails
  //
  // WHY payment emails are sent from the webhook and not from createPaymentIntent:
  //   createPaymentIntent only creates a Payment Intent — a promise to charge the
  //   card.  No funds are captured at that point.  Sending a receipt at creation
  //   time would be factually incorrect.  Stripe's payment_intent.succeeded event
  //   is the only authoritative signal that funds have been captured, making it
  //   the correct trigger for the receipt.  This also covers cases where the
  //   client closes the browser before the confirmation screen loads.
  //
  // WHY receipts are only sent after Stripe confirms payment:
  //   A receipt is a legal document confirming a financial transaction has
  //   completed.  Issuing one before Stripe confirms funds would be misleading
  //   and could expose the platform to disputes or chargebacks.
  //
  // WHY sensitive payment information is never emailed:
  //   Emails are not encrypted end-to-end and may be stored indefinitely in
  //   mail servers, client caches, or backups.  Including card numbers, CVCs,
  //   expiry dates, or Stripe secrets would directly violate PCI DSS and could
  //   enable fraud.  Only safe, publicly visible payment metadata is included.
  //
  // WHY email failures do not affect payment records:
  //   The Transaction and Booking records are the authoritative source of truth
  //   for payment state.  An email delivery failure (e.g. SMTP outage) must
  //   never roll back a committed payment or cause the webhook to return a
  //   non-2xx response (which would trigger costly Stripe retries).  Email is
  //   a notification layer, not part of the payment transaction itself.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Load a payment HTML template and fill all placeholders.
   * WHY separate from _buildBookingEmailHtml: payment templates use a different
   * placeholder set and a different layout; keeping the two helpers independent
   * prevents coupling between the booking and payment email features.
   * Future payment email methods (sendRefundEmail, sendPayoutReadyEmail, etc.)
   * should call this helper so template loading is never duplicated.
   * @param {string} templateName   - Template file name without .html extension
   * @param {Object} placeholders   - Key/value pairs matching {{placeholder}} tokens
   * @returns {string} Populated HTML string
   * @private
   */
  _buildPaymentEmailHtml(templateName, placeholders) {
    const template = this.loadTemplate(templateName);
    return this.replacePlaceholders(template, {
      ...placeholders,
      frontendUrl:   process.env.FRONTEND_URL || 'https://kookaville.app',
      supportEmail:  process.env.SUPPORT_EMAIL || 'support@kookaville.app',
    });
  }

  /**
   * Send a payment receipt email.
   * Called by PaymentService after payment_intent.succeeded is processed and
   * the Transaction record has been committed to the database.
   *
   * Safe fields included: transaction ID, booking reference, payment date,
   * amount, currency, status, chef name, event date, location.
   * Fields NEVER included: card number, CVC, expiry, client secret, webhook
   * secret, Stripe payment method IDs.
   *
   * @param {string} clientEmail      - Recipient's email address
   * @param {string} clientFirstName  - Recipient's first name (for greeting)
   * @param {Object} paymentData
   * @param {string} paymentData.clientName     - Client's full name
   * @param {string} paymentData.bookingId      - Short booking reference (last 8 chars)
   * @param {string} paymentData.transactionId  - Short transaction ID (last 8 chars)
   * @param {string} paymentData.paymentDate    - Human-readable payment date
   * @param {string} paymentData.amount         - Formatted amount (e.g. "GHS 250.00")
   * @param {string} paymentData.currency       - Currency code (e.g. "GHS")
   * @param {string} paymentData.paymentStatus  - Display status label (e.g. "Paid")
   * @param {string} paymentData.chefName       - Chef's full name
   * @param {string} paymentData.eventDate      - Human-readable event date
   * @param {string} paymentData.location       - Event location
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendPaymentReceiptEmail(clientEmail, clientFirstName, paymentData) {
    try {
      const html = this._buildPaymentEmailHtml('payment-receipt', {
        clientName:    paymentData.clientName    || clientFirstName || 'there',
        bookingId:     paymentData.bookingId     || '—',
        transactionId: paymentData.transactionId || '—',
        paymentDate:   paymentData.paymentDate   || '—',
        amount:        paymentData.amount        || '—',
        currency:      paymentData.currency      || '—',
        paymentStatus: paymentData.paymentStatus || 'Paid',
        chefName:      paymentData.chefName      || 'Your Chef',
        eventDate:     paymentData.eventDate     || '—',
        location:      paymentData.location      || 'Not specified',
      });

      return await this.sendEmail({
        to:      clientEmail,
        subject: 'Kookaville — Payment Receipt',
        text: [
          `Hi ${clientFirstName || 'there'},`,
          `Your payment of ${paymentData.amount} has been confirmed.`,
          `Booking Reference: #${paymentData.bookingId}`,
          `Transaction ID: #${paymentData.transactionId}`,
          `Payment Date: ${paymentData.paymentDate}`,
          `Chef: ${paymentData.chefName}`,
          `Event Date: ${paymentData.eventDate}`,
          `Please keep this email as your receipt.`,
        ].join('\n'),
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send payment receipt email: ${error.message}`);
    }
  }

  /**
   * Send a payment failed notification email.
   * Called by PaymentService after payment_intent.payment_failed is processed
   * and the Transaction record has been committed to the database.
   *
   * WHY this email is sent even though no money was taken:
   *   The client may not still have the payment page open when the failure
   *   occurs (e.g. mobile network drop, bank declined async).  Emailing them
   *   ensures they know to retry and that the booking is still pending — not
   *   cancelled.
   *
   * @param {string} clientEmail      - Recipient's email address
   * @param {string} clientFirstName  - Recipient's first name (for greeting)
   * @param {Object} paymentData
   * @param {string} paymentData.clientName    - Client's full name
   * @param {string} paymentData.bookingId     - Short booking reference
   * @param {string} paymentData.amount        - Formatted attempted amount
   * @param {string} paymentData.currency      - Currency code
   * @param {string} paymentData.failureStatus - Display status label
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendPaymentFailedEmail(clientEmail, clientFirstName, paymentData) {
    try {
      const html = this._buildPaymentEmailHtml('payment-failed', {
        clientName:    paymentData.clientName    || clientFirstName || 'there',
        bookingId:     paymentData.bookingId     || '—',
        amount:        paymentData.amount        || '—',
        currency:      paymentData.currency      || '—',
        failureStatus: paymentData.failureStatus || 'Payment Failed',
      });

      return await this.sendEmail({
        to:      clientEmail,
        subject: 'Kookaville — Payment Could Not Be Completed',
        text: [
          `Hi ${clientFirstName || 'there'},`,
          `We were unable to process your payment of ${paymentData.amount} for booking #${paymentData.bookingId}.`,
          `The payment could not be completed.`,
          `Your booking remains pending payment — it has not been cancelled.`,
          `You may safely retry payment from your Kookaville dashboard.`,
          `Need help? Contact us at ${process.env.SUPPORT_EMAIL || 'support@kookaville.app'}.`,
        ].join('\n'),
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send payment failed email: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 15E — Chef / Admin Emails
  //
  // WHY emails are sent only after successful database updates:
  //   The database record is the authoritative source of truth.  Sending an
  //   email before the DB write commits creates a window where the email says
  //   "verified" but the record still says "pending" (e.g. if the write fails
  //   after the email is sent).  Sending after the commit ensures the email
  //   accurately reflects persisted state.
  //
  // WHY notification creation precedes email delivery:
  //   In-app notifications and email serve the same informational purpose but
  //   with different reliability characteristics.  Notifications are written
  //   to the DB synchronously as part of the service call; email delivery
  //   depends on an external SMTP server and can be slower or fail.  Writing
  //   the notification first guarantees the chef is informed even if email
  //   fails.  The ordering also matches the notification → email pipeline
  //   described in the architecture specification.
  //
  // WHY email failures must not affect business operations:
  //   Verification decisions and booking records are committed transactions.
  //   Rolling them back because an SMTP server was temporarily unreachable
  //   would be incorrect and confusing.  Email is a notification layer, not
  //   part of the business transaction itself.  Errors are logged so they can
  //   be investigated and retried without affecting the primary operation.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Shared private helper for chef and admin-related email templates.
   * Loads the named template, injects common env-driven values (frontendUrl,
   * supportEmail), and fills caller-supplied placeholders.
   * WHY separate from _buildBookingEmailHtml / _buildPaymentEmailHtml:
   *   Each feature area owns its own placeholders and layout; coupling them
   *   would create hidden dependencies and make future changes risky.
   *   New payment email methods (sendRefundEmail, sendPayoutReadyEmail, etc.)
   *   should call _buildPaymentEmailHtml; new chef/admin email methods should
   *   call this helper.
   * @param {string} templateName  - Template file name without .html extension
   * @param {Object} placeholders  - Key/value pairs matching {{placeholder}} tokens
   * @returns {string} Populated HTML string
   * @private
   */
  _buildChefEmailHtml(templateName, placeholders) {
    const template = this.loadTemplate(templateName);
    return this.replacePlaceholders(template, {
      ...placeholders,
      frontendUrl:  process.env.FRONTEND_URL  || 'https://kookaville.app',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@kookaville.app',
    });
  }

  /**
   * Send chef verified email.
   * Called by AdminService.verifyChef() after ChefProfile.verificationStatus
   * is committed to "approved" and the in-app notification is created.
   * @param {string} chefEmail      - Chef's email address
   * @param {string} chefFirstName  - Chef's first name (for greeting)
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendChefVerifiedEmail(chefEmail, chefFirstName) {
    try {
      const html = this._buildChefEmailHtml('chef-verified', {
        name:         chefFirstName || 'Chef',
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/dashboard`,
      });

      return await this.sendEmail({
        to:      chefEmail,
        subject: 'Kookaville — Your Chef Account is Verified! 🎉',
        text: [
          `Congratulations ${chefFirstName || 'Chef'}!`,
          `Your Kookaville chef account has been verified.`,
          `You can now accept bookings from clients.`,
          `Visit your dashboard: ${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/dashboard`,
        ].join('\n'),
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send chef verified email: ${error.message}`);
    }
  }

  /**
   * Send chef rejected email.
   * Called by AdminService.rejectChef() after ChefProfile.verificationStatus
   * is committed to "rejected" and the in-app notification is created.
   * @param {string} chefEmail          - Chef's email address
   * @param {string} chefFirstName      - Chef's first name (for greeting)
   * @param {string} verificationNotes  - Admin's rejection reason (stored in ChefProfile.verificationNotes)
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendChefRejectedEmail(chefEmail, chefFirstName, verificationNotes) {
    try {
      const html = this._buildChefEmailHtml('chef-rejected', {
        name:              chefFirstName     || 'Chef',
        verificationNotes: verificationNotes || 'No specific reason provided. Please contact support.',
        dashboardUrl:      `${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/verification`,
      });

      return await this.sendEmail({
        to:      chefEmail,
        subject: 'Kookaville — Chef Verification Update',
        text: [
          `Hi ${chefFirstName || 'Chef'},`,
          `Your chef verification application was not approved at this time.`,
          `Review notes: ${verificationNotes || 'No specific reason provided.'}`,
          `You may update your documents and resubmit at any time.`,
          `Visit: ${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/verification`,
        ].join('\n'),
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send chef rejected email: ${error.message}`);
    }
  }

  /**
   * Send booking request notification email to the chef.
   * Called by BookingService.createBooking() after the booking is saved and
   * the in-app notification is created.
   * This replaces the generic sendBookingCreatedEmail(..., 'chef') call from
   * Phase 15C with a richer, chef-specific template that includes the booking
   * amount and a direct "View Booking" link.
   * @param {string} chefEmail      - Chef's email address
   * @param {string} chefFirstName  - Chef's first name (for greeting)
   * @param {Object} requestData    - Booking request details
   * @param {string} requestData.clientName  - Client's full name
   * @param {string} requestData.bookingId   - Short booking reference
   * @param {string} requestData.eventDate   - Formatted event date
   * @param {string} requestData.eventTime   - Event time (HH:mm)
   * @param {string} requestData.location    - Event location
   * @param {number|string} requestData.guestCount - Number of guests
   * @param {string} requestData.amount      - Formatted booking amount
   * @returns {Promise<Object>} Nodemailer response
   */
  async sendBookingRequestEmail(chefEmail, chefFirstName, requestData) {
    try {
      const html = this._buildChefEmailHtml('booking-request', {
        name:         chefFirstName            || 'Chef',
        clientName:   requestData.clientName   || 'A client',
        bookingId:    requestData.bookingId    || '—',
        eventDate:    requestData.eventDate    || '—',
        eventTime:    requestData.eventTime    || '—',
        location:     requestData.location     || 'Not specified',
        guestCount:   String(requestData.guestCount ?? '—'),
        amount:       requestData.amount       || '—',
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/bookings`,
      });

      return await this.sendEmail({
        to:      chefEmail,
        subject: `Kookaville — New Booking Request from ${requestData.clientName || 'a client'}`,
        text: [
          `Hi ${chefFirstName || 'Chef'},`,
          `You have received a new booking request.`,
          `Client: ${requestData.clientName}`,
          `Booking ID: #${requestData.bookingId}`,
          `Event Date: ${requestData.eventDate}`,
          `Event Time: ${requestData.eventTime}`,
          `Guests: ${requestData.guestCount}`,
          `Amount: ${requestData.amount}`,
          `View the booking: ${process.env.FRONTEND_URL || 'https://kookaville.app'}/chef/bookings`,
        ].join('\n'),
        html,
      });
    } catch (error) {
      throw new Error(`Failed to send booking request email: ${error.message}`);
    }
  }
}

// Create singleton instance to ensure only one transporter is used
const emailService = new EmailService();

export default emailService;
