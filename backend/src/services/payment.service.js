import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
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
      currency: 'ghs', // Stripe expects lowercase ISO currency codes
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
}

export default new PaymentService();
