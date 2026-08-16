import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChefProfile',
      required: [true, 'Chef ID is required'],
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: [true, 'Menu ID is required'],
    },
    bookingDate: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    eventTime: {
      type: String,
      required: [true, 'Event time is required'],
    },
    // Set by the chef when accepting — client never provides this
    duration: {
      type: Number,
      enum: [2, 3, 4, 5],
    },
    // Computed on acceptance: eventTime + duration hours in HH:mm format
    endTime: {
      type: String,
    },
    // Acceptance audit trail
    acceptedAt: {
      type: Date,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'At least 1 guest is required'],
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    paymentDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Support efficient overlap queries (chef+date and client+date lookups)
bookingSchema.index({ chef: 1, bookingDate: 1 });
bookingSchema.index({ client: 1, bookingDate: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
