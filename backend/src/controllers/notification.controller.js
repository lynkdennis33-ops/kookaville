import notificationService from '../services/notification.service.js';

// ─── Notification Controller ───────────────────────────────────────────────────
// Thin controller layer — validates request params, delegates to the service,
// and sends a consistent JSON response. No business logic lives here.

class NotificationController {
  /**
   * GET /api/notifications
   * Returns all notifications for the authenticated user, newest first.
   */
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getNotifications(
        req.user._id
      );

      res.status(200).json({
        success: true,
        data: {
          notifications,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Marks a single notification as read.
   * Only the recipient may mark their own notifications.
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await notificationService.markAsRead(
        id,
        req.user._id
      );

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: {
          notification,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Marks all unread notifications as read for the authenticated user.
   */
  async markAllAsRead(req, res, next) {
    try {
      const count = await notificationService.markAllAsRead(req.user._id);

      res.status(200).json({
        success: true,
        message: `${count} notification(s) marked as read.`,
        data: {
          updatedCount: count,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
