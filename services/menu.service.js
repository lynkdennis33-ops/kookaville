import api from "@/lib/api";

/**
 * Fetch all menus belonging to a specific chef profile.
 * This is a public endpoint — no authentication required.
 *
 * GET /api/menu/:chefId
 *
 * @param {string} chefId  ChefProfile MongoDB _id
 * @returns {Promise<Array>} Array of menu documents (populated with category name)
 */
export async function getMenusByChef(chefId) {
  const { data } = await api.get(`/menus/${chefId}`); //http://localhost:5000/api/menu/chefID
  return data.data.menus;
}
