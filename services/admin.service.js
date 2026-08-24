import api from "@/lib/api";

/**
 * Fetch paginated pending chef applications.
 * GET /api/admin/chefs/pending
 *
 * @param {{ page?, limit?, search?, sortBy?, order? }} params
 * @returns {{ chefs: Array, pagination: Object }}
 */
export async function getPendingChefs(params = {}) {
  const { data } = await api.get("/admin/chefs/pending", { params });
  return data.data;
}

/**
 * Approve a chef application.
 * Sets ChefProfile.verificationStatus = 'approved' and User.role = 'chef'.
 * PATCH /api/admin/chefs/:chefId/verify
 *
 * @param {string} chefId  ChefProfile _id
 */
export async function approveChef(chefId) {
  const { data } = await api.patch(`/admin/chefs/${chefId}/verify`);
  return data;
}

/**
 * Reject a chef application with a reason.
 * PATCH /api/admin/chefs/:chefId/reject
 *
 * @param {string} chefId
 * @param {string} reason
 */
export async function rejectChef(chefId, reason) {
  const { data } = await api.patch(`/admin/chefs/${chefId}/reject`, { reason });
  return data;
}
