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
}

export default new PaymentController();
