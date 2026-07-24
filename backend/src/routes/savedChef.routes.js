import express from 'express';
import savedChefController from '../controllers/savedChef.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';

const router = express.Router();

// All saved-chef endpoints require authentication and the client role.
// Chefs and admins do not have saved-chef lists.

// GET /api/saved-chefs — list the authenticated client's saved chefs
router.get(
  '/',
  auth,
  authorize('client'),
  savedChefController.getSavedChefs.bind(savedChefController),
);

// GET /api/saved-chefs/check/:chefId — check saved status for one chef
// This route MUST come before /:chefId to avoid Express treating "check"
// as a chefId parameter.
router.get(
  '/check/:chefId',
  auth,
  authorize('client'),
  savedChefController.checkSavedChef.bind(savedChefController),
);

// POST /api/saved-chefs/:chefId — save a chef
router.post(
  '/:chefId',
  auth,
  authorize('client'),
  savedChefController.saveChef.bind(savedChefController),
);

// DELETE /api/saved-chefs/:chefId — remove a saved chef
router.delete(
  '/:chefId',
  auth,
  authorize('client'),
  savedChefController.removeSavedChef.bind(savedChefController),
);

export default router;
