import savedChefService from '../services/savedChef.service.js';

class SavedChefController {
  /**
   * POST /api/saved-chefs/:chefId
   * Save a chef for the authenticated client.
   */
  async saveChef(req, res, next) {
    try {
      const { chefId } = req.params;
      const savedChef = await savedChefService.saveChef(req.user._id, chefId);

      res.status(201).json({
        success: true,
        message: 'Chef saved successfully.',
        data: { savedChef },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/saved-chefs/:chefId
   * Remove a saved chef for the authenticated client.
   */
  async removeSavedChef(req, res, next) {
    try {
      const { chefId } = req.params;
      await savedChefService.removeSavedChef(req.user._id, chefId);

      res.status(200).json({
        success: true,
        message: 'Chef removed from saved.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/saved-chefs
   * List all saved chefs for the authenticated client.
   */
  async getSavedChefs(req, res, next) {
    try {
      const savedChefs = await savedChefService.getSavedChefs(req.user._id);

      res.status(200).json({
        success: true,
        data: { savedChefs },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/saved-chefs/check/:chefId
   * Check if the authenticated client has saved a specific chef.
   * Returns { saved: true } or { saved: false }.
   */
  async checkSavedChef(req, res, next) {
    try {
      const { chefId } = req.params;
      const saved = await savedChefService.checkSavedChef(req.user._id, chefId);

      res.status(200).json({
        success: true,
        data: { saved },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SavedChefController();
