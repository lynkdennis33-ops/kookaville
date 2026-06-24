import reviewService from '../services/review.service.js';

class ReviewController {
  /**
   * Create a new review
   * Protected route - requires authentication + client role
   * Chef is resolved from the booking — client must NOT provide chef or client IDs
   */
  async createReview(req, res, next) {
    try {
      const { booking, rating, comment } = req.body;

      // Validate required fields before delegating to service
      if (!booking || rating === undefined || !comment) {
        return res.status(400).json({
          success: false,
          message: 'booking, rating, and comment are required.',
        });
      }

      const review = await reviewService.createReview(req.user._id, req.body);

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully.',
        data: { review },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all reviews for a chef
   * Public route - no authentication required
   */
  async getChefReviews(req, res, next) {
    try {
      const { chefId } = req.params;
      const reviews = await reviewService.getChefReviews(chefId);

      res.status(200).json({
        success: true,
        data: { reviews },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a review by ID
   * Protected route - requires authentication
   * Authorization rules enforced in service
   */
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      await reviewService.deleteReview(req.user, id);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
