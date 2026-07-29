import api from "@/lib/api";

/**
 * Create a new booking.
 * Only callable by authenticated clients.
 * The backend resolves the chef from the selected menu — do NOT send chefId.
 *
 * POST /api/bookings
 *
 * @param {{ menu: string, bookingDate: string, eventTime: string, guests: number, specialRequests?: string }} payload
 * @returns {Promise<Object>} Created booking document
 */
export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  return data.data.booking;
}

/**
 * Fetch all bookings for the authenticated user.
 * Results are filtered by role on the backend:
 *   - client: their own bookings only
 *   - chef:   bookings assigned to their chef profile
 *   - admin:  all bookings
 *
 * GET /api/bookings
 *
 * @returns {Promise<Array>} Array of populated booking documents
 */
export async function getBookings() {
  const { data } = await api.get("/bookings");
  return data.data.bookings;
}

/**
 * Fetch a single booking by its ID.
 * Access control is enforced by the backend based on user role.
 *
 * GET /api/bookings/:id
 *
 * @param {string} id  Booking MongoDB _id
 * @returns {Promise<Object>} Populated booking document
 */
export async function getBookingById(id) {
  const { data } = await api.get(`/bookings/${id}`);
  return data.data.booking;
}

/**
 * Cancel a booking.
 * Clients can only cancel their own pending bookings.
 * Business rules are enforced on the backend.
 *
 * PATCH /api/bookings/:id  { status: "cancelled" }
 *
 * @param {string} id  Booking MongoDB _id
 * @returns {Promise<Object>} Updated booking document
 */
export async function cancelBooking(id) {
  const { data } = await api.patch(`/bookings/${id}`, { status: "cancelled" });
  return data.data.booking;
}
