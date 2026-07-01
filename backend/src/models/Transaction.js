import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChefProfile',
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: 'GHS',
    },

    stripePaymentIntentId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    // ── Escrow / commission fields (populated after Stripe confirms payment) ──

    // Percentage the platform retains.  Stored on each transaction so a future
    // rate change does not retroactively alter historical records.
    platformCommissionPercentage: {
      type: Number,
      default: 10,
    },

    // Absolute GHS amount kept by the platform (amount × commissionPercentage / 100).
    // Defaults to 0 until the webhook handler calculates and stores the value.
    platformCommissionAmount: {
      type: Number,
      default: 0,
    },

    // Amount the chef is entitled to receive (amount − platformCommissionAmount).
    // Defaults to 0 until the webhook handler calculates and stores the value.
    chefEarnings: {
      type: Number,
      default: 0,
    },

    // Tracks where in the payout lifecycle the chef's earnings currently sit.
    //  held  — payment received; money is on the platform, booking not yet complete
    //  ready — booking completed; chef is eligible for payout
    //  paid  — funds have been disbursed (future: via Stripe Connect)
    payoutStatus: {
      type: String,
      enum: ['held', 'ready', 'paid'],
      default: 'held',
    },

    // Timestamps set when payoutStatus transitions to the corresponding state.
    // Stored separately from Mongoose timestamps so they can be exposed
    // selectively per role in the payment history endpoint.
    payoutReadyDate: {
      type: Date,
    },

    payoutPaidDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
