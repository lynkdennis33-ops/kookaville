import api from "@/lib/api";

/**
 * Fetch all messages for a booking, ordered oldest → newest.
 * The backend enforces that the requester is a participant in the booking.
 *
 * GET /api/messages?bookingId=<id>
 *
 * @param {string} bookingId  Booking MongoDB _id
 * @returns {Promise<Array>}  Array of populated message documents
 */
export async function getMessages(bookingId) {
  const { data } = await api.get("/messages", { params: { bookingId } });
  return data.data.messages;
}

/**
 * Send a message on a booking conversation.
 * The backend determines the receiver from the authenticated user and booking
 * participants — the frontend never needs to specify sender or receiver IDs.
 *
 * POST /api/messages
 *
 * @param {string} bookingId  Booking MongoDB _id
 * @param {string} message    Message text
 * @returns {Promise<Object>} Saved message document
 */
export async function sendMessage(bookingId, message) {
  const { data } = await api.post("/messages", { bookingId, message });
  return data.data.message;
}

/**
 * Retrieve all conversations for the authenticated user, sorted by most-recent
 * activity. Each item includes booking details, the last message, and the
 * unread count for the current user.
 *
 * GET /api/messages/conversations
 *
 * @returns {Promise<Array<{booking, lastMessage, unreadCount}>>}
 */
export async function getConversations() {
  const { data } = await api.get("/messages/conversations");
  return data.data.conversations;
}

/**
 * Mark all messages in a booking conversation received by the current user
 * as read. Best-effort — errors are caught by callers and not surfaced.
 *
 * PATCH /api/messages/read
 *
 * @param {string} bookingId  Booking MongoDB _id
 */
export async function markMessagesAsRead(bookingId) {
  await api.patch("/messages/read", { bookingId });
}

/**
 * Return the total unread message count across all conversations for the
 * authenticated user.
 *
 * GET /api/messages/unread-count
 *
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const { data } = await api.get("/messages/unread-count");
  return data.data.count;
}
