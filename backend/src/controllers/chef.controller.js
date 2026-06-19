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
}

export default new ChefController();
