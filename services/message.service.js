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
