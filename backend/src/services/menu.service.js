import Menu from '../models/Menu.js';
import ChefProfile from '../models/ChefProfile.js';
import Category from '../models/Category.js';

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
      images: menuData.images || [],
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
    const allowedFields = ['name', 'description', 'price', 'images', 'category', 'servings', 'ingredients'];

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
}

export default new MenuService();
