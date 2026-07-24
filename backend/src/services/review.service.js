import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ChefProfile from '../models/ChefProfile.js';
import notificationService from './notification.service.js';

class ReviewService {
  /**
   * Recalculate and persist a chef's average rating and total review count
   * Called after every review creation or deletion
   */
  async _recalculateChefRating(chefId) {
    // Aggregate all reviews for this chef to get count and mean rating
    const result = await Review.aggregate([
      { $match: { chef: chefId } },
      {
        $group: {
          _id: '$chef',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      // No reviews remain — reset to defaults
      await ChefProfile.findByIdAndUpdate(chefId, {
        rating: 0,
        totalReviews: 0,
      });
    } else {
      // Round to two decimal places for a clean display value
      const avgRating = Math.round(result[0].avgRating * 100) / 100;
      await ChefProfile.findByIdAndUpdate(chefId, {
        rating: avgRating,
        totalReviews: result[0].count,
      });
    }
  }

  /**
   * Create a review for a completed booking
   * Chef is read from the booking — client must NOT provide chef or client IDs
   * Validates ownership, booking status, and prevents duplicate reviews
   */
  async createReview(userId, reviewData) {
    // Define allowed fields — chef and client are server-resolved, not client-supplied
    const { booking: bookingId, rating, comment } = reviewData;

    // Find the booking and verify it exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify the booking belongs to the authenticated client
    if (booking.client.toString() !== userId.toString()) {
      const error = new Error(
        'You can only review bookings that belong to you.'
      );
      error.statusCode = 403;
      throw error;
    }

    // Verify the booking has been completed before allowing a review
    if (booking.status !== 'completed') {
      const error = new Error(
        'You can only review a booking once it is completed.'
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify the booking has not already been reviewed by this client
    const existing = await Review.findOne({
      booking: bookingId,
      client: userId,
    });
    if (existing) {
      const error = new Error('You have already reviewed this booking.');
      error.statusCode = 409;
      throw error;
    }

    // Read chef from the booking — never from client input
    const chefId = booking.chef;

    // Create the review with server-resolved client and chef IDs
    const review = await Review.create({
      booking: bookingId,
      chef: chefId,
      client: userId,
      rating,
      comment,
    });

    // Recalculate and update the chef's aggregate rating
    await this._recalculateChefRating(chefId);

    // Fetch the chef's user ID — chefId is a ChefProfile ID, not a User ID
    const chefProfile = await ChefProfile.findById(chefId).select('user');

    // Notify the chef of the new review
    await notificationService.createNotification({
      recipient: chefProfile.user,
      title: 'New Review',
      message: 'You received a new review.',
      type: 'review',
      referenceId: review._id,
      referenceModel: 'Review',
    });

    return review;
  }

  /**
   * Get paginated reviews for a chef
   * Public — no authentication required
   * Sorted newest first, client populated with display fields only
   *
   * @param {string} chefId  ChefProfile _id
   * @param {{ page?: number, limit?: number }} options
   */
  async getChefReviews(chefId, options = {}) {
    const { page = 1, limit = 5 } = options;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 5));
    const skip = (pageNum - 1) * limitNum;

    // Verify the chef profile exists before querying reviews
    const chefProfile = await ChefProfile.findById(chefId);
    if (!chefProfile) {
      const error = new Error('Chef not found.');
      error.statusCode = 404;
      throw error;
    }

    const totalItems = await Review.countDocuments({ chef: chefId });
    const totalPages = Math.ceil(totalItems / limitNum);

    const reviews = await Review.find({ chef: chefId })
      .populate('client', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  /**
   * Delete a review by ID
   * Client can delete only their own review
   * Admin can delete any review
   * Chef cannot delete reviews
   */
  async deleteReview(user, reviewId) {
    // Find the review and verify it exists
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found.');
      error.statusCode = 404;
      throw error;
    }

    // Enforce role-based deletion rules
    if (user.role === 'chef') {
      const error = new Error('Chefs cannot delete reviews.');
      error.statusCode = 403;
      throw error;
    }

    if (
      user.role === 'client' &&
      review.client.toString() !== user._id.toString()
    ) {
      const error = new Error('You can only delete your own reviews.');
      error.statusCode = 403;
      throw error;
    }

    // Store chefId before deletion to recalculate rating after
    const chefId = review.chef;

    await review.deleteOne();

    // Recalculate and update the chef's aggregate rating
    await this._recalculateChefRating(chefId);
  }
}

export default new ReviewService();
