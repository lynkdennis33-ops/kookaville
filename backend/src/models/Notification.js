import mongoose from 'mongoose';

// ─── Notification Schema ───────────────────────────────────────────────────────
// Stores in-app notifications for all users.
// Notifications are created by services (e.g. booking, message, review)
// and surfaced to the recipient via the notifications API.

const notificationSchema = new mongoose.Schema(
  {
    // The user who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },

    // Short heading displayed in the notification UI
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },

    // Full notification body text
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },

    // Category of notification — used for filtering and icon selection on the frontend
    type: {
      type: String,
      enum: ['booking', 'message', 'review', 'system', 'payment'],
      required: [true, 'Type is required'],
    },

    // Optional reference to the related document (e.g. a Booking or Message ID)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // The Mongoose model name the referenceId belongs to (e.g. 'Booking', 'Message')
    referenceModel: {
      type: String,
      default: null,
    },

    // Whether the recipient has read this notification
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
