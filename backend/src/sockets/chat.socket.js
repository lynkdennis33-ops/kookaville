import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import ChefProfile from '../models/ChefProfile.js';

/**
 * Chat socket handler.
 *
 * Every connection is authenticated via JWT before any events are processed.
 * Room joins are authorized against MongoDB — the user must be a booking
 * participant (client or chef). User identity is always derived from the
 * verified token; nothing from the client payload is trusted for identity.
 *
 * @param {import('socket.io').Server} io
 */
export default function initChatSocket(io) {
  // ── Connection-level JWT authentication ────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found.'));
      }
      if (user.status !== 'active') {
        return next(new Error('Account is not active.'));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user._id.toString();
    console.log(`Socket connected: ${socket.id} (user: ${userId})`);

    /**
     * joinBooking
     * Payload: { bookingId: string }
     *
     * Verifies that the authenticated user is either the booking's client or
     * the user behind the booking's chef profile before joining the room.
     * The userId is read from socket.data.user (server-side, verified JWT) —
     * never from the client payload.
     */
    socket.on('joinBooking', async ({ bookingId }) => {
      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          socket.emit('authError', { message: 'Booking not found.' });
          return;
        }

        const chefProfile = await ChefProfile.findById(booking.chef);
        if (!chefProfile) {
          socket.emit('authError', { message: 'Chef profile not found.' });
          return;
        }

        const clientId    = booking.client.toString();
        const chefUserId  = chefProfile.user.toString();

        if (userId !== clientId && userId !== chefUserId) {
          socket.emit('authError', { message: 'Not authorized for this booking.' });
          console.warn(`Socket ${socket.id} (user: ${userId}) denied room ${bookingId}`);
          return;
        }

        socket.join(bookingId);
        console.log(`Socket ${socket.id} (user: ${userId}) joined booking room ${bookingId}`);
      } catch (err) {
        console.error('joinBooking error:', err.message);
        socket.emit('error', { message: 'Failed to join booking room.' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user: ${userId})`);
    });
  });
}
