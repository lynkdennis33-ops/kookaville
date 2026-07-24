import api from "@/lib/api";

/**
 * Save a chef for the authenticated client.
 *
 * POST /api/saved-chefs/:chefId
 *
 * @param {string} chefId  ChefProfile MongoDB _id
 */
export async function saveChef(chefId) {
  const { data } = await api.post(`/saved-chefs/${chefId}`);
  return data;
}

/**
 * Remove a saved chef for the authenticated client.
 *
 * DELETE /api/saved-chefs/:chefId
 *
 * @param {string} chefId  ChefProfile MongoDB _id
 */
export async function removeSavedChef(chefId) {
  const { data } = await api.delete(`/saved-chefs/${chefId}`);
  return data;
}

/**
 * Fetch all saved chefs for the authenticated client.
 * Each item has { _id, chef: ChefProfile+user, createdAt }.
 *
 * GET /api/saved-chefs
 *
 * @returns {Promise<Array>} array of saved-chef documents with populated chef
 */
export async function getSavedChefs() {
  const { data } = await api.get("/saved-chefs");
  return data.data.savedChefs;
}

/**
 * Check whether the authenticated client has saved a specific chef.
 *
 * GET /api/saved-chefs/check/:chefId
 *
 * @param {string} chefId  ChefProfile MongoDB _id
 * @returns {Promise<boolean>}
 */
export async function checkSavedChef(chefId) {
  const { data } = await api.get(`/saved-chefs/check/${chefId}`);
  return data.data.saved;
}
