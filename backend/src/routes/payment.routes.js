import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// POST /api/payments/create-intent
// Protected route — authenticated clients only
router.post(
  '/create-intent',
  auth,
  authorize('client'),
  paymentController.createPaymentIntent.bind(paymentController)
);

export default router;
