/**
 * Chat socket handler.
 *
 * Receives the Socket.IO server instance and registers all chat-related
 * socket events. No business logic lives here — the REST API handles
 * all validation, authorization, and persistence. This layer only
 * manages room membership and broadcasts already-saved messages.
 *
 * @param {import('socket.io').Server} io
 */
export default function initChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    /**
     * joinBooking
     * Payload: { bookingId: string }
     *
     * Adds the socket to the room identified by the booking ID so it
     * will receive 'newMessage' broadcasts for that conversation.
     */
    socket.on('joinBooking', ({ bookingId }) => {
      socket.join(bookingId);
      console.log(`Socket ${socket.id} joined booking room ${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
