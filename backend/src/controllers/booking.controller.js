import bookingService from '../services/booking.service.js';

class BookingController {
  /**
   * Create a new booking
   * Protected route - requires authentication
   * Only clients should create bookings
   * Chef is resolved from the menu - client must NOT provide chef ID
   */
  async createBooking(req, res, next) {
    try {
      // Role is already guaranteed to be 'client' by authorize middleware
      const booking = await bookingService.createBooking(
        req.user._id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Booking created successfully.',
        data: {
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bookings for the authenticated user
   * Protected route - requires authentication
   * Results filtered by role: client sees own, chef sees assigned, admin sees all
   * Supports ?status=&page=&limit= for chef portal filtering and pagination
   */
  async getBookings(req, res, next) {
    try {
      const { status, page, limit } = req.query;
      const result = await bookingService.getBookings(req.user, { status, page, limit });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single booking by ID
   * Protected route - requires authentication
   * Access control enforced in service based on role
   */
  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await bookingService.getBookingById(req.user, id);

      res.status(200).json({
        success: true,
        data: {
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a booking's status
   * Protected route - requires authentication
   * Transition rules and access control enforced in service
   */
  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required.',
        });
      }

      const booking = await bookingService.updateBookingStatus(
        req.user,
        id,
        status
      );

      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully.',
        data: {
          booking,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Chef accepts a pending booking with a chosen duration.
   * Protected route - requires chef role.
   * Body: { durationHours: 2|3|4|5 }
   */
  async acceptBooking(req, res, next) {
    try {
      const { id } = req.params;
      const { durationHours } = req.body;

      if (!durationHours) {
        return res.status(400).json({
          success: false,
          message: 'durationHours is required to accept a booking.',
        });
      }

      const booking = await bookingService.acceptBooking(req.user, id, durationHours);

      res.status(200).json({
        success: true,
        message: 'Booking accepted.',
        data: { booking },
      });
    } catch (error) {
      next(error);
    }
  }
}

const bookingController = new BookingController();
export default bookingController;
