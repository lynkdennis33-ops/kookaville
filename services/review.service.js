import api from "@/lib/api";

/**
 * Fetch public reviews for a chef profile, sorted newest first.
 * Reviewer's first name, last name, and avatar are included.
 *
 * GET /api/reviews/chef/:chefId
 *
 * @param {string} chefId  ChefProfile MongoDB _id
 * @param {{ page?: number, limit?: number }} options
 * @returns {Promise<{ reviews: Array, pagination: Object }>}
 */
export async function getChefReviews(chefId, { page = 1, limit = 5 } = {}) {
  const { data } = await api.get(`/reviews/chef/${chefId}`, {
    params: { page, limit },
  });
  return data.data; // { reviews, pagination }
}
