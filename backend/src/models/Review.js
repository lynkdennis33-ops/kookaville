import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChefProfile',
      required: [true, 'Chef ID is required'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must not exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for the same booking by the same client
reviewSchema.index({ booking: 1, client: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
