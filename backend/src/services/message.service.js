import Booking from '../models/Booking.js';
import ChefProfile from '../models/ChefProfile.js';
import Message from '../models/Message.js';
import { getIo } from '../sockets/io.js';
import notificationService from './notification.service.js';

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

    // Populate sender/receiver so the socket payload matches the REST getMessages shape
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName avatar')
      .populate('receiver', 'firstName lastName avatar');

    // Broadcast to all sockets in the booking room.
    // Only emitted after a successful save — failures throw before reaching here.
    getIo()?.to(bookingId).emit('newMessage', {
      bookingId,
      message: populatedMessage,
    });

    // Notify the receiver of the new message
    await notificationService.createNotification({
      recipient: receiverId,
      title: 'New Message',
      message: 'You received a new message.',
      type: 'message',
      referenceId: bookingId,
      referenceModel: 'Booking',
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

  /**
   * List all booking conversations for the authenticated user, enriched with
   * the latest message and the unread count for that user.
   * Sorted by most-recent activity (last message date → booking creation date).
   *
   * @param {Object} user  - req.user (must have _id and role)
   * @returns {Promise<Array<{booking, lastMessage, unreadCount}>>}
   */
  async getConversations(user) {
    let bookingQuery = {};

    if (user.role === 'client') {
      bookingQuery = { client: user._id };
    } else if (user.role === 'chef') {
      const chefProfile = await ChefProfile.findOne({ user: user._id });
      if (!chefProfile) return [];
      bookingQuery = { chef: chefProfile._id };
    }
    // admin: empty query returns all bookings

    const bookings = await Booking.find(bookingQuery)
      .populate('client', 'firstName lastName avatar')
      .populate({
        path: 'chef',
        populate: { path: 'user', select: 'firstName lastName avatar' },
      })
      .populate('menu', 'name price')
      .sort({ createdAt: -1 });

    const conversations = await Promise.all(
      bookings.map(async (booking) => {
        const [lastMessage, unreadCount] = await Promise.all([
          Message.findOne({ booking: booking._id })
            .populate('sender', 'firstName lastName')
            .sort({ createdAt: -1 }),
          Message.countDocuments({
            booking: booking._id,
            receiver: user._id,
            isRead: false,
          }),
        ]);

        return {
          booking,
          lastMessage: lastMessage || null,
          unreadCount,
        };
      })
    );

    // Most-recently-active conversations first
    conversations.sort((a, b) => {
      const dateA = a.lastMessage?.createdAt ?? a.booking.createdAt;
      const dateB = b.lastMessage?.createdAt ?? b.booking.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    return conversations;
  }

  /**
   * Mark all messages received by the authenticated user in a booking as read.
   * Authorization: requester must be a booking participant.
   *
   * @param {ObjectId|string} userId    - Authenticated user's ID
   * @param {string}          bookingId - Booking MongoDB _id
   */
  async markMessagesAsRead(userId, bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const error = new Error('Booking not found.');
      error.statusCode = 404;
      throw error;
    }

    const chefProfile = await ChefProfile.findById(booking.chef);
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    const clientId    = booking.client.toString();
    const chefUserId  = chefProfile.user.toString();
    const requesterId = userId.toString();

    if (requesterId !== clientId && requesterId !== chefUserId) {
      const error = new Error('Unauthorized.');
      error.statusCode = 403;
      throw error;
    }

    await Message.updateMany(
      { booking: bookingId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  /**
   * Return the total number of unread messages for the authenticated user
   * across all conversations.
   *
   * @param {ObjectId|string} userId
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    return Message.countDocuments({ receiver: userId, isRead: false });
  }
}

export default new MessageService();
