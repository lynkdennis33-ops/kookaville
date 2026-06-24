import express from 'express';
import reviewController from '../controllers/review.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// POST create a new review
// Protected route - requires authentication + client role
router.post(
  '/',
  auth,
  authorize('client'),
  reviewController.createReview.bind(reviewController)
);

// GET all reviews for a chef
// Public route - no authentication required
router.get(
  '/:chefId',
  reviewController.getChefReviews.bind(reviewController)
);

// DELETE a review by ID
// Protected route - requires authentication
// Authorization rules (client owns / admin) enforced in service
router.delete(
  '/:id',
  auth,
  reviewController.deleteReview.bind(reviewController)
);

export default router;
