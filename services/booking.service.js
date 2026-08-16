import api from "@/lib/api";

/**
 * Create a new booking.
 * Only callable by authenticated clients.
 * The backend resolves the chef from the selected menu — do NOT send chefId.
 * Duration is intentionally excluded — the chef chooses it when accepting.
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
 * Fetch a chef's availability schedule and, when date is provided, the already-accepted
 * bookings for that calendar day (accepted bookings only — pending does not block slots).
 *
 * GET /api/chef/:chefId/availability?date=YYYY-MM-DD
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
 * Results are filtered by role on the backend.
 * Supports optional query params for chef portal: status, page, limit.
 *
 * GET /api/bookings
 *
 * @param {{ status?: string, page?: number, limit?: number }} [params]
 * @returns {Promise<{ bookings: Array, pagination?: Object }>}
 */
export async function getBookings(params = {}) {
  const { data } = await api.get("/bookings", { params });
  return data.data;
}

/**
 * Fetch a single booking by its ID.
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
 * Cancel a booking (client only — pending bookings only).
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

/**
 * Chef accepts a booking request and sets the duration.
 * Backend validates overlap and working-hour constraints.
 *
 * PATCH /api/bookings/:id/accept  { durationHours: 2|3|4|5 }
 *
 * @param {string} id            Booking MongoDB _id
 * @param {number} durationHours  2, 3, 4, or 5
 * @returns {Promise<Object>} Updated booking document
 */
export async function acceptBooking(id, durationHours) {
  const { data } = await api.patch(`/bookings/${id}/accept`, { durationHours });
  return data.data.booking;
}

/**
 * Chef rejects a pending booking.
 *
 * PATCH /api/bookings/:id  { status: "rejected" }
 *
 * @param {string} id  Booking MongoDB _id
 * @returns {Promise<Object>} Updated booking document
 */
export async function rejectBooking(id) {
  const { data } = await api.patch(`/bookings/${id}`, { status: "rejected" });
  return data.data.booking;
}
