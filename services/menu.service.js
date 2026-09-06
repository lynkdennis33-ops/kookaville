import api from "@/lib/api";

/**
 * Fetch active menus for a specific chef profile (public, used on booking page).
 *
 * GET /api/menus/:chefId
 */
export async function getMenusByChef(chefId) {
  const { data } = await api.get(`/menus/${chefId}`);
  return data.data.menus;
}

/**
 * Fetch ALL menus (including inactive) for the authenticated chef.
 * Used by Chef Portal menu management.
 *
 * GET /api/menus/my
 */
export async function getMyMenus() {
  const { data } = await api.get("/menus/my");
  return data.data.menus;
}

/**
 * Create a new menu. Chef is resolved from the auth token on the backend.
 *
 * POST /api/menus
 */
export async function createMenu(menuData) {
  const { data } = await api.post("/menus", menuData);
  return data.data.menu;
}

/**
 * Update allowed fields of a menu (name, description, price, category, servings, ingredients).
 * Ownership is verified on the backend.
 *
 * PATCH /api/menus/:id
 */
export async function updateMenu(id, menuData) {
  const { data } = await api.patch(`/menus/${id}`, menuData);
  return data.data.menu;
}

/**
 * Toggle isActive on a menu. Ownership is verified on the backend.
 *
 * PATCH /api/menus/:id/active
 */
export async function toggleMenuActive(id) {
  const { data } = await api.patch(`/menus/${id}/active`);
  return data.data.menu;
}

/**
 * Permanently delete a menu. Ownership is verified on the backend.
 *
 * DELETE /api/menus/:id
 */
export async function deleteMenu(id) {
  await api.delete(`/menus/${id}`);
}

/**
 * Upload or replace the image for a menu. Uses multipart/form-data.
 * Ownership is verified on the backend. Requires chef role.
 *
 * PATCH /api/menus/:menuId/image
 */
export async function updateMenuImage(menuId, file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.patch(`/menus/${menuId}/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data.image;
}
