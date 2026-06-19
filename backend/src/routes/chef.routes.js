import express from 'express';
import chefController from '../controllers/chef.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST create chef profile
// Protected route - requires authentication
// Clients can apply to become a chef
router.post('/profile', auth, chefController.createProfile.bind(chefController));

// GET user's chef profile
router.get('/profile', auth, chefController.getProfile.bind(chefController));

// PATCH update chef profile
router.patch('/profile', auth, chefController.updateProfile.bind(chefController));

export default router;
