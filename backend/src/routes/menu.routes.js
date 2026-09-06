import express from 'express';
import menuController from '../controllers/menu.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// POST create a new menu
// Protected route - requires authentication
router.post('/', auth, menuController.createMenu.bind(menuController));

// GET the authenticated chef's own menus (active + inactive) — must be before /:chefId
// Protected — chef role only
router.get('/my', auth, authorize('chef'), menuController.getMyMenus.bind(menuController));

// GET all menus belonging to a specific chef
// Public route
router.get('/:chefId', menuController.getMenusByChef.bind(menuController));

// PATCH update a menu
// Protected route - requires authentication
router.patch('/:id', auth, menuController.updateMenu.bind(menuController));

// PATCH update menu image
// Protected — chef role only. Only the owning chef may update a menu's image.
// Field name: "image" (multipart/form-data, single file)
router.patch(
  '/:menuId/image',
  auth,
  authorize('chef'),
  uploadSingle,
  menuController.updateMenuImage.bind(menuController)
);

// PATCH activate or deactivate a menu (toggles isActive)
// Protected — requires authentication, ownership verified in service
router.patch('/:id/active', auth, menuController.toggleMenuActive.bind(menuController));

// DELETE a menu
// Protected route - requires authentication
router.delete('/:id', auth, menuController.deleteMenu.bind(menuController));

export default router;
