import express from 'express';
import menuController from '../controllers/menu.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST create a new menu
// Protected route - requires authentication
router.post('/', auth, menuController.createMenu.bind(menuController));

// GET all menus belonging to a specific chef
// Public route
router.get('/:chefId', menuController.getMenusByChef.bind(menuController));

// PATCH update a menu
// Protected route - requires authentication
router.patch('/:id', auth, menuController.updateMenu.bind(menuController));

// DELETE a menu
// Protected route - requires authentication
router.delete('/:id', auth, menuController.deleteMenu.bind(menuController));

export default router;
