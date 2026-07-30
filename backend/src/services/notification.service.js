import Notification from '../models/Notification.js';

// ─── Notification Service ──────────────────────────────────────────────────────
// Handles all business logic for creating and managing notifications.
// Controllers remain thin — all data access and rules live here.

class NotificationService {
  /**
   * Create a new notification and persist it to the database.
   *
   * @param {Object} data
   * @param {ObjectId} data.recipient      - The user who receives the notification
   * @param {string}   data.title          - Short heading for the notification
   * @param {string}   data.message        - Full notification body text
   * @param {string}   data.type           - Category: booking | message | review | system | payment
   * @param {ObjectId} [data.referenceId]  - Optional related document ID
   * @param {string}   [data.referenceModel] - Optional Mongoose model name for referenceId
   * @returns {Promise<Notification>}
   */
  async createNotification(data) {
    const { recipient, title, message, type, referenceId, referenceModel } =
      data;

    // Build and save the notification document
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      referenceId: referenceId || null,
      referenceModel: referenceModel || null,
    });

    return notification;
  }

  /**
   * Retrieve all notifications for a given user, newest first.
   *
   * @param {ObjectId|string} userId - Authenticated user's ID
   * @returns {Promise<Notification[]>}
   */
  async getNotifications(userId) {
    const notifications = await Notification.find({ recipient: userId }).sort({
      createdAt: -1,
    });

    return notifications;
  }

  /**
   * Mark a single notification as read.
   * Only the notification's recipient may perform this action.
   *
   * @param {string} notificationId - ID of the notification to mark
   * @param {ObjectId|string} userId - Authenticated user's ID
   * @returns {Promise<Notification>}
   */
  async markAsRead(notificationId, userId) {
    // Attempt to locate the notification
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      const error = new Error('Notification not found.');
      error.statusCode = 404;
      throw error;
    }

    // Ensure only the intended recipient can mark it as read
    if (notification.recipient.toString() !== userId.toString()) {
      const error = new Error(
        'You are not authorized to update this notification.'
      );
      error.statusCode = 403;
      throw error;
    }

    // Mark as read and persist
    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * Count unread notifications for a given user.
   *
   * @param {ObjectId|string} userId - Authenticated user's ID
   * @returns {Promise<number>} Number of unread notifications
   */
  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
    return count;
  }

  /**
   * Mark all unread notifications as read for a given user.
   *
   * @param {ObjectId|string} userId - Authenticated user's ID
   * @returns {Promise<number>} Number of notifications updated
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    // modifiedCount reflects the number of documents actually changed
    return result.modifiedCount;
  }
}

export default new NotificationService();
