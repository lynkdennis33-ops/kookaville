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




// GET all approved chefs with pagination and sorting - Public route
// Query: ?page=1&limit=10&sort=newest
router.get('/', chefController.getChefs.bind(chefController));

// GET search and filter chefs - Public route (must come before /:id)
// Query parameters: keyword, cuisine, serviceArea, minPrice, maxPrice
router.get('/search', chefController.searchChefs.bind(chefController));

// GET featured chefs - Public route (must come before /:id)
router.get('/featured', chefController.getFeaturedChefs.bind(chefController));

// GET specific chef by ID - Public route
// :id refers to ChefProfile _id
router.get('/:id', chefController.getChef.bind(chefController));


export default router;
