import paymentService from '../services/payment.service.js';

class PaymentController {
  /**
   * Create a Stripe Payment Intent for an existing booking
   * Protected route — authenticated clients only
   * Delegates all business logic to paymentService
   */
  async createPaymentIntent(req, res, next) {
    try {
      const { bookingId } = req.body;

      // Validate that bookingId was supplied
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: 'bookingId is required.',
        });
      }

      const { clientSecret, transaction } =
        await paymentService.createPaymentIntent(req.user._id, bookingId);

      res.status(201).json({
        success: true,
        message: 'Payment Intent created successfully.',
        data: {
          clientSecret,
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/payments/history
   * Protected route — any authenticated user (client, chef, admin).
   * Delegates to paymentService which applies role-based filtering.
   */
  async getPaymentHistory(req, res, next) {
    try {
      const transactions = await paymentService.getPaymentHistory(req.user);

      res.status(200).json({
        success: true,
        data: {
          transactions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhook
   * Public route — called by Stripe, NOT by an authenticated user.
   * Delegates signature verification and event handling to paymentService.
   * Always returns { received: true } on success so Stripe stops retrying.
   */
  async handleWebhook(req, res, next) {
    try {
      await paymentService.handleWebhook(req);

      // Acknowledge receipt to Stripe.  If we return anything other than a
      // 2xx status code, Stripe will retry the webhook delivery.
      res.status(200).json({ received: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
