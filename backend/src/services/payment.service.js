import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import ChefProfile from '../models/ChefProfile.js';
import stripe from '../config/stripe.js';

class PaymentService {
  /**
   * Create a Stripe Payment Intent for an existing booking.
   *
   * Security guarantees:
   *  - Amount is read from the menu stored in the database — never from the client.
   *  - Currency is hardcoded to GHS.
   *  - Client and chef are resolved from the booking document.
   *
   * @param {string} userId   - Authenticated user's ID (from req.user._id)
   * @param {string} bookingId - Booking ID from req.body
   * @returns {{ clientSecret: string, transaction: object }}
   */
  async createPaymentIntent(userId, bookingId) {
    // ── 1. Find and validate the booking ───────────────────────────────────
    const booking = await Booking.findById(bookingId).populate('menu');

    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    // Ensure the booking belongs to the authenticated client
    if (booking.client.toString() !== userId.toString()) {
      const error = new Error(
        'You do not have permission to pay for this booking.'
      );
      error.statusCode = 403;
      throw error;
    }

    // ── 2. Prevent duplicate payments ──────────────────────────────────────
    if (booking.paymentStatus === 'paid') {
      const error = new Error('Booking has already been paid.');
      error.statusCode = 400;
      throw error;
    }

    // ── 3. Read the price from the menu (server-side only) ─────────────────
    const menu = booking.menu;

    if (!menu || menu.price == null) {
      const error = new Error('Menu price could not be resolved for this booking.');
      error.statusCode = 400;
      throw error;
    }

    const amount = menu.price; // stored in GHS (whole units)

    // ── 4. Create Stripe Payment Intent ────────────────────────────────────
    // Stripe requires the smallest currency unit (pesewas for GHS → multiply by 100)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert GHS → pesewas
      currency: 'usd', // Stripe expects lowercase ISO currency codes
      metadata: {
        bookingId: bookingId.toString(),
        clientId: userId.toString(),
      },
    });

    // ── 5. Persist a Transaction record with status = pending ──────────────
    // Do NOT mark the booking as paid here — that happens in Phase 12B via webhook
    const transaction = await Transaction.create({
      booking: booking._id,
      client: booking.client,    // resolved from booking — never from frontend
      chef: booking.chef,        // resolved from booking — never from frontend
      amount,                    // GHS amount from the menu
      currency: 'GHS',           // stored in uppercase for readability
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    return {
      clientSecret: paymentIntent.client_secret,
      transaction,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Stripe Webhook Handler
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verify the incoming Stripe webhook event and dispatch to the appropriate
   * handler based on event.type.
   *
   * WHY signature verification:
   *   Anyone on the internet can POST to /api/payments/webhook.
   *   Stripe signs every webhook payload with STRIPE_WEBHOOK_SECRET so we can
   *   prove the request genuinely came from Stripe and has not been tampered
   *   with.  Skipping this check would allow attackers to fake payment events
   *   and mark bookings as paid without any real money being transferred.
   *
   * @param {import('express').Request} req - Express request (body is a raw Buffer)
   * @returns {Promise<void>}
   */
  async handleWebhook(req) {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
      // stripe.webhooks.constructEvent() hashes the raw body with the webhook
      // secret and compares it against the signature header.  It throws if
      // anything does not match.
      event = stripe.webhooks.constructEvent(
        req.body,                            // Buffer from express.raw()
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      // A bad signature means the request is either forged or the wrong secret
      // is configured.  Return 400 so Stripe knows not to retry.
      const error = new Error(`Webhook signature verification failed: ${err.message}`);
      error.statusCode = 400;
      throw error;
    }

    // Route to the correct handler by event type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this._handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this._handlePaymentIntentFailed(event.data.object);
        break;

      // Future event types (refunds, disputes, etc.) will be added here in
      // later phases.  Unknown events are silently ignored — Stripe recommends
      // always returning 200 for event types you do not handle so Stripe does
      // not keep retrying.
      default:
        break;
    }
  }

  // ── Private: payment_intent.succeeded ──────────────────────────────────

  /**
   * Mark a Transaction as paid and update the related Booking.
   *
   * WHY idempotency:
   *   Stripe may deliver the same webhook more than once (network retries,
   *   etc.).  Checking transaction.status before writing prevents a second
   *   delivery from creating duplicate side-effects (e.g. double-updating
   *   paymentDate, double-triggering downstream logic).
   *
   * WHY Booking is updated only here (not in createPaymentIntent):
   *   A Payment Intent is created client-side before the card is charged.
   *   The charge has not gone through at that point.  We only consider the
   *   booking paid when Stripe confirms the funds have been captured, which
   *   is exactly what payment_intent.succeeded signals.
   *
   * @param {import('stripe').Stripe.PaymentIntent} paymentIntent
   */
  async _handlePaymentIntentSucceeded(paymentIntent) {
    // Find the Transaction that corresponds to this Payment Intent
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    // Guard: no matching transaction — could be a test event or a race
    // condition.  Log and return safely rather than throwing.
    if (!transaction) {
      console.warn(
        `[Webhook] payment_intent.succeeded: no Transaction found for PaymentIntent ${
          paymentIntent.id
        }. Ignoring.`
      );
      return;
    }

    // Idempotency guard: if this event was already processed, do nothing
    if (transaction.status === 'paid') {
      console.info(
        `[Webhook] payment_intent.succeeded: Transaction ${transaction._id} is already paid. Skipping.`
      );
      return;
    }

    // ── Calculate escrow amounts ────────────────────────────────────────────
    // The platform retains a commission percentage; the remainder belongs to
    // the chef.  Funds are held on the platform (payoutStatus = 'held') until
    // the booking is marked completed — at which point releaseChefPayout()
    // transitions payoutStatus to 'ready'.
    //
    // WHY we hold funds:
    //   Releasing payment before the service is delivered creates a chargeback
    //   risk for the platform.  Holding until completion protects both parties.
    //
    // WHY no Stripe transfer here:
    //   Stripe Connect (which handles actual bank transfers) is not implemented
    //   in this MVP.  When it is, the 'ready' payoutStatus will be the trigger
    //   for a scheduled transfer job to call stripe.transfers.create().
    const commissionPercentage = 10;
    const commissionAmount = (transaction.amount * commissionPercentage) / 100;
    const chefEarnings = transaction.amount - commissionAmount;

    // ── Update Transaction ──────────────────────────────────────────────────
    transaction.status = 'paid';
    transaction.payoutStatus = 'held';
    transaction.platformCommissionPercentage = commissionPercentage;
    transaction.platformCommissionAmount = commissionAmount;
    transaction.chefEarnings = chefEarnings;
    await transaction.save();

    // ── Update Booking ──────────────────────────────────────────────────────
    // Only update paymentStatus and paymentDate — do not touch booking.status
    // (accepted/rejected/etc.) as that is managed separately by the chef.
    await Booking.findByIdAndUpdate(transaction.booking, {
      paymentStatus: 'paid',
      paymentDate: new Date(),
    });
  }

  // ── Private: payment_intent.payment_failed ──────────────────────────────

  /**
   * Mark a Transaction as failed.
   *
   * Booking.paymentStatus is intentionally left unchanged — a failed payment
   * attempt does not cancel the booking itself; the client may retry.
   *
   * @param {import('stripe').Stripe.PaymentIntent} paymentIntent
   */
  async _handlePaymentIntentFailed(paymentIntent) {
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!transaction) {
      console.warn(
        `[Webhook] payment_intent.payment_failed: no Transaction found for PaymentIntent ${
          paymentIntent.id
        }. Ignoring.`
      );
      return;
    }

    transaction.status = 'failed';
    await transaction.save();
    // NOTE: Booking.paymentStatus is NOT updated here.  A failed payment does
    // not invalidate the booking — the client can attempt payment again.
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 12D — Escrow Release
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mark a paid transaction as ready-for-payout once the booking completes.
   *
   * Called automatically by booking.service.js when booking.status becomes
   * 'completed'.  The frontend MUST NOT call this endpoint directly.
   *
   * WHY payouts only become ready after booking completion:
   *   The chef earns the fee by delivering the service.  Releasing funds
   *   before the event happens would incentivise no-shows and complicate
   *   refund handling.  Completion is the contractual proof of delivery.
   *
   * WHY no Stripe transfer occurs here:
   *   Actual disbursement to a chef's bank account requires Stripe Connect
   *   (connected accounts, transfer objects, payout schedules).  That
   *   infrastructure is out of scope for this MVP.  Setting payoutStatus =
   *   'ready' creates a clear audit trail that a future scheduled job (or
   *   admin action) can consume to trigger real transfers.
   *
   * @param {string|mongoose.Types.ObjectId} bookingId
   * @returns {Promise<void>}
   */
  async releaseChefPayout(bookingId) {
    // ── 1. Find the transaction linked to this booking ──────────────────────
    const transaction = await Transaction.findOne({ booking: bookingId });

    if (!transaction) {
      const error = new Error('No transaction found for this booking.');
      error.statusCode = 404;
      throw error;
    }

    // ── 2. Ensure payment was actually received ─────────────────────────────
    if (transaction.status !== 'paid') {
      const error = new Error('Booking has not been paid.');
      error.statusCode = 400;
      throw error;
    }

    // ── 3. Idempotency guard ────────────────────────────────────────────────
    // If the payout has already been marked ready or paid, there is nothing
    // further to do.  This protects against duplicate webhook deliveries or
    // accidental double-calls.
    if (transaction.payoutStatus !== 'held') {
      return;
    }

    // ── 4. Transition to ready ──────────────────────────────────────────────
    // No Stripe transfer is created here — see method-level comment above.
    transaction.payoutStatus = 'ready';
    transaction.payoutReadyDate = new Date();
    await transaction.save();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 12C — Payment History (updated in 12D with field projection)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Return the transaction history visible to the authenticated user.
   *
   * Role-based visibility:
   *  - client → only transactions they initiated (Transaction.client == user._id)
   *  - chef   → only transactions for their ChefProfile (Transaction.chef == chefProfile._id)
   *  - admin  → all transactions
   *
   * The Transaction schema stores `chef` as a ChefProfile ObjectId, NOT a
   * User ObjectId.  For chef users we therefore resolve ChefProfile first.
   *
   * @param {object} user - req.user (populated by auth middleware)
   * @returns {Promise<Array>} Sorted array of Transaction documents (newest first)
   */
  async getPaymentHistory(user) {
    let query;

    if (user.role === 'client') {
      // ── Client: return only their own transactions ──────────────────────
      query = Transaction.find({ client: user._id });

    } else if (user.role === 'chef') {
      // ── Chef: resolve ChefProfile, then filter by its _id ────────────────
      // Transaction.chef stores ChefProfile._id, not User._id, so we must
      // look up the chef's profile before querying transactions.
      const chefProfile = await ChefProfile.findOne({ user: user._id });

      if (!chefProfile) {
        const error = new Error('Chef profile not found.');
        error.statusCode = 404;
        throw error;
      }

      query = Transaction.find({ chef: chefProfile._id });

    } else if (user.role === 'admin') {
      // ── Admin: return all transactions ───────────────────────────────────
      query = Transaction.find();

    } else {
      // Unsupported role — should never reach here given existing auth guards
      const error = new Error(`Role '${user.role}' is not authorised to view payment history.`);
      error.statusCode = 403;
      throw error;
    }

    // ── Apply role-based field projection ─────────────────────────────────
    // Each role receives only the fields relevant to them.  Sensitive
    // commission data is hidden from clients and chefs.
    //
    // client — sees payment info only; payout/commission fields are hidden
    // chef   — sees own earnings and payout state; commission amounts hidden
    // admin  — sees all fields
    if (user.role === 'client') {
      query = query.select(
        'booking client chef amount currency status createdAt'
      );
    } else if (user.role === 'chef') {
      query = query.select(
        'booking client chef amount currency status createdAt ' +
        'chefEarnings payoutStatus payoutReadyDate payoutPaidDate'
      );
    }
    // admin: no .select() — Mongoose returns all fields by default

    // Populate the booking reference, the client's basic info, and the chef
    // ChefProfile reference.
    const transactions = await query
      .populate('booking')
      .populate('client', 'firstName lastName email')
      .populate('chef')
      .sort({ createdAt: -1 }); // newest first

    return transactions;
  }
}

export default new PaymentService();
