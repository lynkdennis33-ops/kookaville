import Booking from '../models/Booking.js';
import ChefProfile from '../models/ChefProfile.js';
import Message from '../models/Message.js';
import { getIo } from '../sockets/io.js';

class MessageService {
  /**
   * Create a new message tied to a booking.
   * The sender is always the authenticated user.
   * The receiver is determined by the backend based on booking participants.
   */
  async createMessage(userId, data) {
    const { bookingId, message } = data;

    // 1. Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Determine participants — booking.chef is a ChefProfile ID
    const chefProfile = await ChefProfile.findById(booking.chef);
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const clientId = booking.client.toString();
    const chefUserId = chefProfile.user.toString();
    const senderId = userId.toString();

    // 3. Verify sender belongs to this booking
    if (senderId !== clientId && senderId !== chefUserId) {
      const error = new Error('Unauthorized.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Determine receiver automatically
    const receiverId = senderId === clientId ? chefUserId : clientId;

    // 5. Validate message content
    if (!message || !message.trim()) {
      const error = new Error('Message cannot be empty.');
      error.statusCode = 400;
      throw error;
    }

    // 6. Save message
    const newMessage = await Message.create({
      sender: userId,
      receiver: receiverId,
      booking: bookingId,
      message: message.trim(),
    });

    // Broadcast to all sockets in the booking room.
    // Only emitted after a successful save — failures throw before reaching here.
    getIo()?.to(bookingId).emit('newMessage', {
      bookingId,
      message: newMessage,
    });

    return newMessage;
  }

  /**
   * Retrieve all messages for a booking, oldest first.
   * Only booking participants may access the conversation.
   */
  async getMessages(userId, bookingId) {
    // 1. Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Determine participants
    const chefProfile = await ChefProfile.findById(booking.chef);
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const clientId = booking.client.toString();
    const chefUserId = chefProfile.user.toString();
    const requesterId = userId.toString();

    // 3. Verify requester belongs to this booking
    if (requesterId !== clientId && requesterId !== chefUserId) {
      const error = new Error('Unauthorized.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Return messages sorted oldest first
    const messages = await Message.find({ booking: bookingId })
      .populate('sender', 'firstName lastName avatar')
      .populate('receiver', 'firstName lastName avatar')
      .sort({ createdAt: 1 });

    return messages;
  }
}

export default new MessageService();
