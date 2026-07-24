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

// GET all reviews for a chef (explicit /chef/ prefix — preferred)
// Public route - no authentication required
// Supports pagination: ?page=1&limit=5
router.get(
  '/chef/:chefId',
  reviewController.getChefReviews.bind(reviewController)
);

// GET all reviews for a chef (legacy path — kept for backward compatibility)
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
