import Menu from '../models/Menu.js';
import ChefProfile from '../models/ChefProfile.js';
import Category from '../models/Category.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';

class MenuService {
  /**
   * Create a new menu for a chef
   * Validates that the chef profile exists and category is valid
   * Checks for duplicate menu names per chef
   */
  async createMenu(userId, menuData) {
    // Find ChefProfile for the authenticated user
    const chefProfile = await ChefProfile.findOne({ user: userId });

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify category exists
    const category = await Category.findById(menuData.category);
    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    // Check for duplicate menu name for this chef
    const existingMenu = await Menu.findOne({
      chef: chefProfile._id,
      name: menuData.name,
    });

    if (existingMenu) {
      const error = new Error('Menu already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Create new menu
    const menu = new Menu({
      chef: chefProfile._id,
      name: menuData.name.trim(),
      description: menuData.description.trim(),
      price: menuData.price,
      // image is intentionally excluded from creation.
      // Menu images are managed through PATCH /api/menus/:menuId/image which
      // handles Cloudinary upload, old-image deletion, and ownership checks.
      category: menuData.category,
      servings: menuData.servings,
      ingredients: menuData.ingredients || [],
    });

    await menu.save();
    return menu;
  }

  /**
   * Get all menus belonging to a specific chef
   * Populates category name
   * Sorted newest first
   */
  async getMenusByChef(chefId) {
    const menus = await Menu.find({ chef: chefId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    return menus;
  }

  /**
   * Update a menu with ownership verification
   * Only allows updating: name, description, price, images, category, servings, ingredients
   */
  async updateMenu(userId, menuId, updateData) {
    // Find authenticated user's ChefProfile
    const chefProfile = await ChefProfile.findOne({ user: userId });

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // Find the menu
    const menu = await Menu.findById(menuId);

    if (!menu) {
      const error = new Error('Menu not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (menu.chef.toString() !== chefProfile._id.toString()) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    }

    // Define allowed fields for menu update
    // Note: image is intentionally excluded — use PATCH /api/menus/:menuId/image
    // which handles Cloudinary upload, old-image deletion, ownership checks, and
    // stores the required { url, publicId } structure.
    const allowedFields = ['name', 'description', 'price', 'category', 'servings', 'ingredients'];

    // Filter update data to only include allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    // If category is being updated, verify it exists
    if (filteredData.category) {
      const category = await Category.findById(filteredData.category);
      if (!category) {
        const error = new Error('Category not found.');
        error.statusCode = 404;
        throw error;
      }
    }

    // If name is being updated, check for duplicate for this chef
    if (filteredData.name && filteredData.name !== menu.name) {
      const existingMenu = await Menu.findOne({
        chef: chefProfile._id,
        name: filteredData.name,
        _id: { $ne: menuId },
      });

      if (existingMenu) {
        const error = new Error('Menu already exists.');
        error.statusCode = 409;
        throw error;
      }

      filteredData.name = filteredData.name.trim();
    }

    // Trim description if provided
    if (filteredData.description !== undefined) {
      filteredData.description = filteredData.description.trim();
    }

    // Update menu with filtered data
    const updatedMenu = await Menu.findByIdAndUpdate(menuId, filteredData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name');

    return updatedMenu;
  }

  /**
   * Delete a menu with ownership verification
   */
  async deleteMenu(userId, menuId) {
    // Find authenticated user's ChefProfile
    const chefProfile = await ChefProfile.findOne({ user: userId });

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // Find the menu
    const menu = await Menu.findById(menuId);

    if (!menu) {
      const error = new Error('Menu not found.');
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership
    if (menu.chef.toString() !== chefProfile._id.toString()) {
      const error = new Error('Forbidden');
      error.statusCode = 403;
      throw error;
    }

    // Delete the menu
    await Menu.findByIdAndDelete(menuId);
  }

  /**
   * Update the image for a specific menu.
   *
   * WHY upload logic lives in the service and not the controller:
   *   Controllers are responsible only for HTTP concerns: reading the request
   *   and sending the response.  Deciding how to verify ownership, which
   *   Cloudinary folder to use, whether to delete the previous image, and how
   *   to persist the result are business rules that belong in the service layer
   *   so they can be tested and reused independently of the transport layer.
   *
   * @param {string} userId     - Authenticated user's MongoDB _id (from JWT)
   * @param {string} menuId     - Menu document _id from the route parameter
   * @param {Buffer} fileBuffer - Raw image bytes from req.file.buffer
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async updateMenuImage(userId, menuId, fileBuffer) {
    // 1. Resolve the authenticated user's chef profile.
    //    WHY: The Menu schema stores the ChefProfile _id in menu.chef, not the
    //    User _id.  We need the ChefProfile to perform an ownership check.
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Find the target menu.
    const menu = await Menu.findById(menuId);
    if (!menu) {
      const error = new Error('Menu not found.');
      error.statusCode = 404;
      throw error;
    }

    // 3. Verify ownership.
    //    WHY: Without this check any authenticated chef could overwrite another
    //    chef's menu image by supplying an arbitrary menuId.  We compare the
    //    menu's chef field against the authenticated user's ChefProfile _id to
    //    ensure a chef can only modify their own menus.
    if (menu.chef.toString() !== chefProfile._id.toString()) {
      const error = new Error('You do not have permission to update this menu image.');
      error.statusCode = 403;
      throw error;
    }

    // 4. Delete the previous Cloudinary image BEFORE uploading the new one.
    //    WHY: Every upload creates a new Cloudinary asset.  If we upload first
    //    and skip deletion, the previous image becomes an orphan — it still
    //    consumes storage quota but can no longer be reached through the
    //    database.  Deleting first keeps the account clean and avoids runaway
    //    storage costs as the menu catalogue grows.
    if (menu.image && menu.image.publicId) {
      await deleteFromCloudinary(menu.image.publicId);
    }

    // 5. Upload the new image.
    const { url, publicId } = await uploadToCloudinary(fileBuffer, 'kookaville/menu-images');

    // 6. Persist both url and publicId.
    //    WHY publicId is stored: Cloudinary deletes assets by public_id, not
    //    by URL.  Storing only the URL makes future replacements fragile because
    //    the public_id would then need to be extracted from the URL string.
    menu.image = { url, publicId };
    await menu.save();

    return { url, publicId };
  }
}

export default new MenuService();
