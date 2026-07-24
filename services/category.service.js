import api from "@/lib/api";

/**
 * Fetch all active categories from the backend.
 *
 * @returns {Promise<Array>} array of category objects
 */
export async function getCategories() {
  const { data } = await api.get("/categories");
  return data.data.categories;
}
