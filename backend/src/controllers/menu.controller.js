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

  /**
   * Update the image for a specific menu.
   * Protected — chef role only. Only the owning chef may update a menu's image.
   *
   * Controller responsibilities:
   *   - Confirm that multer attached a file to the request
   *   - Delegate all upload and persistence logic to the service
   *   - Return the 200 response with the updated image object
   */
  async updateMenuImage(req, res, next) {
    try {
      // Validate that multer placed a file on the request.
      // Reject early so we never hit the service or Cloudinary without a file.
      if (!req.file) {
        const error = new Error('No file uploaded. Please attach an image with field name "image".');
        error.statusCode = 400;
        throw error;
      }

      const { menuId } = req.params;
      const image = await menuService.updateMenuImage(req.user._id, menuId, req.file.buffer);

      res.status(200).json({
        success: true,
        message: 'Menu image updated successfully.',
        data: {
          image,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MenuController();
