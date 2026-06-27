import express from 'express';
import notificationController from '../controllers/notification.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ─── Notification Routes ───────────────────────────────────────────────────────
// All routes require authentication — notifications are private to the recipient.

// GET /api/notifications
// Returns all notifications for the currently authenticated user (newest first)
router.get(
  '/',
  auth,
  notificationController.getNotifications.bind(notificationController)
);

// PATCH /api/notifications/read-all
// Marks every unread notification as read for the authenticated user
// NOTE: This route must be declared BEFORE /:id/read to avoid Express
//       interpreting "read-all" as a dynamic :id parameter.
router.patch(
  '/read-all',
  auth,
  notificationController.markAllAsRead.bind(notificationController)
);

// PATCH /api/notifications/:id/read
// Marks a single notification as read — only the recipient may do this
router.patch(
  '/:id/read',
  auth,
  notificationController.markAsRead.bind(notificationController)
);

export default router;
