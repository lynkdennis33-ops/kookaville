import express from 'express';
import bookingController from '../controllers/booking.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// POST create a new booking
// Protected route - requires authentication + client role
router.post('/', auth, authorize('client'), bookingController.createBooking.bind(bookingController));

// GET all bookings for the authenticated user (role-based filtering)
// Protected route - requires authentication
router.get('/', auth, bookingController.getBookings.bind(bookingController));

// GET a single booking by ID
// Protected route - requires authentication
// Access control enforced by role
router.get('/:id', auth, bookingController.getBookingById.bind(bookingController));

// PATCH update booking status
// Protected route - requires authentication
// Transition rules enforced by role
router.patch('/:id', auth, bookingController.updateBookingStatus.bind(bookingController));

export default router;
