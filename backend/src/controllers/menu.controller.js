import menuService from '../services/menu.service.js';

class MenuController {
  /**
   * Create a new menu
   * Protected route - requires authentication
   * Chef can only create menus for their own profile
   */
  async createMenu(req, res, next) {
    try {
      const menu = await menuService.createMenu(req.user._id, req.body);

      res.status(201).json({
        success: true,
        message: 'Menu created successfully.',
        data: {
          menu,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all menus belonging to a specific chef
   * Public route
   * Populates category name
   * Sorted newest first
   */
  async getMenusByChef(req, res, next) {
    try {
      const { chefId } = req.params;
      const menus = await menuService.getMenusByChef(chefId);

      res.status(200).json({
        success: true,
        data: {
          menus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a menu
   * Protected route - requires authentication
   * Chef can only update their own menus
   * Allows updating: name, description, price, images, category, servings, ingredients
   */
  async updateMenu(req, res, next) {
    try {
      const { id } = req.params;
      const menu = await menuService.updateMenu(req.user._id, id, req.body);

      res.status(200).json({
        success: true,
        message: 'Menu updated successfully.',
        data: {
          menu,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a menu
   * Protected route - requires authentication
   * Chef can only delete their own menus
   */
  async deleteMenu(req, res, next) {
    try {
      const { id } = req.params;
      await menuService.deleteMenu(req.user._id, id);

      res.status(200).json({
        success: true,
        message: 'Menu deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MenuController();
