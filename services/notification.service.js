import api from "@/lib/api";

/**
 * Fetch all notifications for the authenticated user, newest first.
 * GET /api/notifications
 * @returns {Promise<Array>} Array of notification documents
 */
export async function getNotifications() {
  const { data } = await api.get("/notifications");
  return data.data.notifications;
}

/**
 * Fetch the unread notification count for the authenticated user.
 * GET /api/notifications/unread-count
 * @returns {Promise<number>} Unread notification count
 */
export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.data.count;
}

/**
 * Mark a single notification as read.
 * PATCH /api/notifications/:id/read
 * @param {string} id - Notification MongoDB _id
 * @returns {Promise<Object>} Updated notification document
 */
export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data.notification;
}

/**
 * Mark all unread notifications as read for the authenticated user.
 * PATCH /api/notifications/read-all
 * @returns {Promise<number>} Number of notifications updated
 */
export async function markAllNotificationsAsRead() {
  const { data } = await api.patch("/notifications/read-all");
  return data.data.updatedCount;
}

/**
 * Resolve a navigation path from a notification's type and the user's role.
 * Returns null when no sensible destination exists — callers should close the
 * panel without navigating rather than guessing a broken URL.
 *
 * Backend notification types: booking | message | review | payment | system
 *
 * @param {Object} notification - Notification document
 * @param {string} userRole     - Authenticated user's role (client | chef | admin)
 * @returns {string|null}
 */
export function getNotificationHref(notification, userRole) {
  const { type } = notification;

  if (userRole === "chef") {
    if (type === "booking") return "/chef-portal/bookings";
    if (type === "payment") return "/chef-portal/earnings";
    if (type === "message") return "/chef-portal/bookings";
    return null;
  }

  if (userRole === "admin") {
    if (type === "booking") return "/admin/bookings";
    if (type === "payment") return "/admin/dashboard";
    return "/admin/dashboard";
  }

  // client (default)
  if (type === "booking") return "/dashboard/bookings";
  if (type === "payment") return "/dashboard/payments";
  if (type === "message") return "/dashboard/messages";
  if (type === "review") return "/dashboard/bookings";
  return null;
}
