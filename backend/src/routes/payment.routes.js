import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// POST /api/payments/webhook
// PUBLIC route — Stripe is the caller, not an authenticated user.
// No auth or authorize middleware must be applied here; Stripe does not send
// JWT tokens.  Security is provided instead by Stripe's HMAC signature which
// is verified inside paymentService.handleWebhook().
// express.raw() is configured in app.js for this path so that the raw
// request body is available for signature verification.
router.post(
  '/webhook',
  paymentController.handleWebhook.bind(paymentController)
);

// POST /api/payments/create-intent
// Protected route — authenticated clients only
router.post(
  '/create-intent',
  auth,
  authorize('client'),
  paymentController.createPaymentIntent.bind(paymentController)
);

// GET /api/payments/history
// Protected route — any authenticated user (client, chef, admin).
// Role-based visibility is handled inside paymentService, so no authorize()
// middleware is needed here.
router.get(
  '/history',
  auth,
  paymentController.getPaymentHistory.bind(paymentController)
);

export default router;
