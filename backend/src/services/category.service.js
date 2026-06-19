import Category from '../models/Category.js';

class CategoryService {
  /**
   * Create a new category
   * Checks for case-insensitive duplicate before creating
   */
  async createCategory(data) {
    const { name, description, isActive } = data;

    // Check for case-insensitive duplicate
    const existingCategory = await Category.findOne({
      name: new RegExp(`^${name}$`, 'i'),
    });

    if (existingCategory) {
      const error = new Error('Category already exists.');
      error.statusCode = 409;
      throw error;
    }

    // Create new category
    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    await category.save();
    return category;
  }

  /**
   * Get all active categories
   * Returns only categories where isActive = true
   * Sorted alphabetically by name
   */
  async getCategories() {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return categories;
  }

  /**
   * Update a category
   * Only allows updating: name, description, isActive
   * Checks for case-insensitive duplicate when updating name
   */
  async updateCategory(categoryId, updateData) {
    // Define allowed fields for update
    const allowedFields = ['name', 'description', 'isActive'];

    // Filter update data to only include allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    // If name is being updated, check for case-insensitive duplicate
    if (filteredData.name) {
      const existingCategory = await Category.findOne({
        name: new RegExp(`^${filteredData.name}$`, 'i'),
        _id: { $ne: categoryId },
      });

      if (existingCategory) {
        const error = new Error('Category already exists.');
        error.statusCode = 409;
        throw error;
      }

      filteredData.name = filteredData.name.trim();
    }

    // Trim description if provided
    if (filteredData.description !== undefined) {
      filteredData.description = filteredData.description.trim();
    }

    // Update category with filtered data
    const category = await Category.findByIdAndUpdate(categoryId, filteredData, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    return category;
  }

  /**
   * Soft delete a category
   * Sets isActive = false instead of permanently deleting
   * Does not remove the document from MongoDB
   */
  async deleteCategory(categoryId) {
    // Find the category first
    const category = await Category.findById(categoryId);

    if (!category) {
      const error = new Error('Category not found.');
      error.statusCode = 404;
      throw error;
    }

    // If already inactive, return success
    if (!category.isActive) {
      return category;
    }

    // Soft delete by setting isActive = false
    category.isActive = false;
    await category.save();

    return category;
  }
}

export default new CategoryService();
