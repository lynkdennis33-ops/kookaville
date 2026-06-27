import Booking from '../models/Booking.js';
import Menu from '../models/Menu.js';
import ChefProfile from '../models/ChefProfile.js';
import notificationService from './notification.service.js';

class BookingService {
  /**
   * Create a new booking for a client
   * Reads chef from the menu - client must NOT provide chef ID
   * Validates booking date is not in the past
   */
  async createBooking(userId, bookingData) {
    // Define allowed fields for booking creation
    const allowedFields = [
      'menu',
      'bookingDate',
      'eventTime',
      'guests',
      'specialRequests',
    ];

    // Filter incoming data to only include allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (bookingData.hasOwnProperty(field)) {
        filteredData[field] = bookingData[field];
      }
    });

    // Validate eventTime format — must be HH:mm (e.g. 09:00, 13:30)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!filteredData.eventTime || !timeRegex.test(filteredData.eventTime)) {
      const error = new Error('Invalid event time format. Use HH:mm.');
      error.statusCode = 400;
      throw error;
    }

    // Combine bookingDate + eventTime into a single Date for accurate past-check
    const [hours, minutes] = filteredData.eventTime.split(':').map(Number);
    const bookingDateTime = new Date(filteredData.bookingDate);

    if (isNaN(bookingDateTime.getTime())) {
      const error = new Error('Invalid booking date.');
      error.statusCode = 400;
      throw error;
    }

    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Reject if the combined booking date/time is in the past
    if (bookingDateTime <= new Date()) {
      const error = new Error('Booking date and time cannot be in the past.');
      error.statusCode = 400;
      throw error;
    }

    // Validate guests minimum
    if (!filteredData.guests || filteredData.guests < 1) {
      const error = new Error('At least 1 guest is required.');
      error.statusCode = 400;
      throw error;
    }

    // Find menu and verify it exists
    const menu = await Menu.findById(filteredData.menu);
    if (!menu) {
      const error = new Error('Menu not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify the chef is approved — only approved chefs are bookable
    const chefProfile = await ChefProfile.findById(menu.chef);
    if (!chefProfile || chefProfile.verificationStatus !== 'approved') {
      const error = new Error('This chef is not available for booking.');
      error.statusCode = 400;
      throw error;
    }

    // Read chef from menu - client never provides chef ID
    const chefId = menu.chef;

    // Create booking with server-resolved fields
    const booking = new Booking({
      client: userId,
      chef: chefId,
      menu: menu._id,
      bookingDate: filteredData.bookingDate,
      eventTime: filteredData.eventTime,
      guests: filteredData.guests,
      specialRequests: filteredData.specialRequests,
      // status defaults to 'pending' via schema default
    });

    await booking.save();

    // Notify the chef of the new booking request — chefProfile is already in scope above
    await notificationService.createNotification({
      recipient: chefProfile.user,
      title: 'New Booking Request',
      message: 'You have received a new booking request.',
      type: 'booking',
      referenceId: booking._id,
      referenceModel: 'Booking',
    });

    return booking;
  }

  /**
   * Get bookings based on the authenticated user's role
   * - client: only their own bookings
   * - chef: bookings assigned to their ChefProfile
   * - admin: all bookings
   * Sorted newest first, populated with client, chef (with user), and menu
   */
  async getBookings(user) {
    let query = {};

    if (user.role === 'client') {
      // Return only bookings where this user is the client
      query = { client: user._id };
    } else if (user.role === 'chef') {
      // Find the chef's profile to get their ChefProfile._id
      const chefProfile = await ChefProfile.findOne({ user: user._id });

      if (!chefProfile) {
        const error = new Error('Chef profile not found.');
        error.statusCode = 404;
        throw error;
      }

      query = { chef: chefProfile._id };
    }
    // admin: query stays empty — returns all bookings

    const bookings = await Booking.find(query)
      .populate('client', 'firstName lastName')
      .populate({
        path: 'chef',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('menu', 'name price')
      .sort({ createdAt: -1 });

    return bookings;
  }

  /**
   * Get a single booking by ID
   * Access control by role:
   * - client: can only view their own booking
   * - chef: can only view bookings assigned to their ChefProfile
   * - admin: can view any booking
   */
  async getBookingById(user, bookingId) {
    // Find booking with all populated references
    const booking = await Booking.findById(bookingId)
      .populate('client', 'firstName lastName')
      .populate({
        path: 'chef',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('menu', 'name price');

    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify access rights based on role
    if (user.role === 'client') {
      // Client can only view their own booking
      if (booking.client._id.toString() !== user._id.toString()) {
        const error = new Error('You are not authorized to view this booking.');
        error.statusCode = 403;
        throw error;
      }
    } else if (user.role === 'chef') {
      // Chef can only view bookings assigned to their ChefProfile
      const chefProfile = await ChefProfile.findOne({ user: user._id });

      if (!chefProfile) {
        const error = new Error('Chef profile not found.');
        error.statusCode = 404;
        throw error;
      }

      if (booking.chef._id.toString() !== chefProfile._id.toString()) {
        const error = new Error('You are not authorized to view this booking.');
        error.statusCode = 403;
        throw error;
      }
    }
    // admin: no restriction

    return booking;
  }

  /**
   * Update the status of a booking
   * Enforces role-based transition rules:
   * - client: can only cancel their own pending bookings
   * - chef: can accept/reject pending or complete accepted bookings assigned to them
   * - admin: can set any status on any booking
   */
  async updateBookingStatus(user, bookingId, status) {
    // Find the booking (unpopulated — we only need IDs for access checks)
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'client') {
      // Client can only cancel their own booking
      if (booking.client.toString() !== user._id.toString()) {
        const error = new Error('You are not authorized to update this booking.');
        error.statusCode = 403;
        throw error;
      }

      if (status !== 'cancelled') {
        const error = new Error('Clients can only cancel bookings.');
        error.statusCode = 403;
        throw error;
      }

      // Client can only cancel a pending booking
      if (booking.status !== 'pending') {
        const error = new Error('Only pending bookings can be cancelled.');
        error.statusCode = 400;
        throw error;
      }
    } else if (user.role === 'chef') {
      // Chef can only manage bookings assigned to their ChefProfile
      const chefProfile = await ChefProfile.findOne({ user: user._id });

      if (!chefProfile) {
        const error = new Error('Chef profile not found.');
        error.statusCode = 404;
        throw error;
      }

      if (booking.chef.toString() !== chefProfile._id.toString()) {
        const error = new Error('You are not authorized to update this booking.');
        error.statusCode = 403;
        throw error;
      }

      // Chef cannot cancel bookings
      if (status === 'cancelled') {
        const error = new Error('Chefs cannot cancel bookings.');
        error.statusCode = 403;
        throw error;
      }

      // Validate allowed chef transitions
      const chefTransitions = {
        pending: ['accepted', 'rejected'],
        accepted: ['completed'],
      };

      const allowed = chefTransitions[booking.status];

      if (!allowed || !allowed.includes(status)) {
        const error = new Error(
          `Invalid status transition from '${booking.status}' to '${status}'.`
        );
        error.statusCode = 400;
        throw error;
      }
    }
    // admin: no transition restrictions

    // Apply the status update
    booking.status = status;
    await booking.save({ validateBeforeSave: true });

    // Return populated booking
    const updatedBooking = await Booking.findById(booking._id)
      .populate('client', 'firstName lastName')
      .populate({
        path: 'chef',
        populate: { path: 'user', select: 'firstName lastName' },
      })
      .populate('menu', 'name price');

    // Send notification to the relevant party based on the new status.
    // accepted / rejected / completed → notify the client
    // cancelled (client action)       → notify the chef
    if (status === 'accepted') {
      await notificationService.createNotification({
        recipient: updatedBooking.client._id,
        title: 'Booking Accepted',
        message: 'Your booking has been accepted.',
        type: 'booking',
        referenceId: updatedBooking._id,
        referenceModel: 'Booking',
      });
    } else if (status === 'rejected') {
      await notificationService.createNotification({
        recipient: updatedBooking.client._id,
        title: 'Booking Rejected',
        message: 'Your booking has been rejected.',
        type: 'booking',
        referenceId: updatedBooking._id,
        referenceModel: 'Booking',
      });
    } else if (status === 'completed') {
      await notificationService.createNotification({
        recipient: updatedBooking.client._id,
        title: 'Booking Completed',
        message: 'Your booking has been completed. Please leave a review.',
        type: 'booking',
        referenceId: updatedBooking._id,
        referenceModel: 'Booking',
      });
    } else if (status === 'cancelled') {
      // Chef user ID is nested inside the populated chef profile
      await notificationService.createNotification({
        recipient: updatedBooking.chef.user._id,
        title: 'Booking Cancelled',
        message: 'The client cancelled the booking.',
        type: 'booking',
        referenceId: updatedBooking._id,
        referenceModel: 'Booking',
      });
    }

    return updatedBooking;
  }
}

const bookingService = new BookingService();
export default bookingService;
