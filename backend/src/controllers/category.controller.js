import categoryService from '../services/category.service.js';

class CategoryController {
  /**
   * Get all active categories
   * Public route
   * Returns categories sorted alphabetically
   */
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getCategories();

      res.status(200).json({
        success: true,
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category
   * Protected route - Admin only
   * Request body: { name, description, isActive }
   */
  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);

      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category
   * Protected route - Admin only
   * Allows updating: name, description, isActive
   * Request body: { name?, description?, isActive? }
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.updateCategory(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (soft delete) a category
   * Protected route - Admin only
   * Sets isActive = false instead of permanently deleting
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: 'Category deactivated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
