import api from "@/lib/api";

/**
 * Create a new booking.
 * Only callable by authenticated clients.
 * The backend resolves the chef from the selected menu — do NOT send chefId.
 *
 * POST /api/bookings
 *
 * @param {{ menu: string, bookingDate: string, eventTime: string, duration: number, guests: number, specialRequests?: string }} payload
 * @returns {Promise<Object>} Created booking document
 */
export async function createBooking(payload) {
  const { data } = await api.post("/bookings", payload);
  return data.data.booking;
}

/**
 * Fetch a chef's availability schedule and, when date is provided, the already-booked
 * slots for that calendar day (pending + accepted bookings only).
 *
 * GET /api/chef/:chefId/availability?date=YYYY-MM-DD
 *
 * Response without date:  { availability: [...] }
 * Response with date:     { dayAvailability: { day, startTime, endTime } | null, bookedSlots: [...] }
 *
 * @param {string} chefId     ChefProfile MongoDB _id
 * @param {string} [dateISO]  Date string in YYYY-MM-DD format
 * @returns {Promise<Object>}
 */
export async function getChefAvailability(chefId, dateISO) {
  const params = dateISO ? { date: dateISO } : {};
  const { data } = await api.get(`/chef/${chefId}/availability`, { params });
  return data.data;
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
