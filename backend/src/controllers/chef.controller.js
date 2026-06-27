import chefService from '../services/chef.service.js';

class ChefController {
  /**
   * Create a new chef profile
   * Protected route - requires authentication
   * Client users can apply to become a chef
   */
  async createProfile(req, res, next) {
    try {
      const chefProfile = await chefService.createChefProfile(req.user._id, req.body);

      res.status(201).json({
        success: true,
        message: 'Chef profile submitted successfully. Waiting for admin approval.',
        data: {
          chefProfile,
        },
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return next(error);
      }
      next(error);
    }
  }

  /**
   * Get currently authenticated user's chef profile
   * Protected route
   */
  async getProfile(req, res, next) {
    try {
      const chefProfile = await chefService.getChefProfile(req.user._id);

      res.status(200).json({
        success: true,
        data: {
          chefProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update chef profile
   * Protected route
   * Allows updating: bio, yearsOfExperience, specialties, cuisines, serviceAreas, pricePerPerson, gallery, availability
   */
  async updateProfile(req, res, next) {
    try {
      const chefProfile = await chefService.updateChefProfile(req.user._id, req.body);

      res.status(200).json({
        success: true,
        message: 'Chef profile updated successfully.',
        data: {
          chefProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all approved chefs for discovery with pagination and sorting
   * Public route
   * Query parameters: page, limit, sort
   */
  async getChefs(req, res, next) {
    try {
      const { page, limit, sort } = req.query;
      const result = await chefService.getAllChefs({ page, limit, sort });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific chef profile by ID
   * Public route
   * :id refers to ChefProfile _id
   */
  async getChef(req, res, next) {
    try {
      const { id } = req.params;
      const chef = await chefService.getChefById(id);

      res.status(200).json({
        success: true,
        data: {
          chef,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search and filter approved chefs
   * Public route
   * Query parameters:
   * - keyword: search in bio, specialties, cuisines (case-insensitive)
   * - cuisine: filter by cuisine
   * - serviceArea: filter by service area
   * - minPrice: minimum price per person
   * - maxPrice: maximum price per person
   */
  async searchChefs(req, res, next) {
    try {
      const chefs = await chefService.searchChefs(req.query);

      res.status(200).json({
        success: true,
        data: {
          chefs,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured chefs for homepage
   * Public route
   * Returns first 6 approved chefs sorted by newest first
   */
  async getFeaturedChefs(req, res, next) {
    try {
      const chefs = await chefService.getFeaturedChefs();

      res.status(200).json({
        success: true,
        data: {
          chefs,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a chef profile's verification status
   * Admin-only route
   * :id refers to ChefProfile _id
   * Body: { status: 'approved' | 'rejected' | 'pending' }
   */
  async updateVerificationStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Verification status is required.',
        });
      }

      const chefProfile = await chefService.updateVerificationStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Chef profile ${status}.`,
        data: {
          chefProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChefController();
