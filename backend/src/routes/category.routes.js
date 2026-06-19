import express from 'express';
import categoryController from '../controllers/category.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// GET all active categories - Public route
router.get('/', categoryController.getCategories.bind(categoryController));

// POST create new category - Protected (Admin only)
router.post('/', auth, authorize('admin'), categoryController.createCategory.bind(categoryController));

// PATCH update category - Protected (Admin only)
router.patch('/:id', auth, authorize('admin'), categoryController.updateCategory.bind(categoryController));

// DELETE soft delete category - Protected (Admin only)
router.delete('/:id', auth, authorize('admin'), categoryController.deleteCategory.bind(categoryController));

export default router;
