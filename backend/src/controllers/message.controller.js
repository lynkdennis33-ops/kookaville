import messageService from '../services/message.service.js';

class MessageController {
  async createMessage(req, res, next) {
    try {

      const {bookingId, message} = req.body;

      if(!bookingId || !message) {
        const error = new Error('Booking ID and message are required.');
        error.statusCode = 400;
        throw error;
      }
      const newMessage = await messageService.createMessage(req.user._id, { bookingId, message });



      res.status(201).json({
        success: true,
        message: 'Message sent successfully.',
        data: {
          message: newMessage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {

        const { bookingId } = req.query;

if (!bookingId) {
  const error = new Error('Booking ID is required.');
  error.statusCode = 400;
  throw error;
}
      const messages = await messageService.getMessages(
        req.user._id,
        bookingId
      );

      res.status(200).json({
        success: true,
        data: {
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await messageService.getConversations(req.user);
      res.status(200).json({ success: true, data: { conversations } });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        const error = new Error('Booking ID is required.');
        error.statusCode = 400;
        throw error;
      }
      await messageService.markMessagesAsRead(req.user._id, bookingId);
      res.status(200).json({ success: true, message: 'Messages marked as read.' });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await messageService.getUnreadCount(req.user._id);
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
