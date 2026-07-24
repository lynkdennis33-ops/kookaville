import SavedChef from '../models/SavedChef.js';
import ChefProfile from '../models/ChefProfile.js';

class SavedChefService {
  /**
   * Save a chef for a client.
   *
   * Validates that the chef profile exists and is approved, then creates the
   * saved relationship.  The compound unique index on { client, chef } ensures
   * duplicates are rejected at the database level as an extra safety net.
   *
   * @param {ObjectId|string} userId  – authenticated client's User _id
   * @param {string}          chefId  – ChefProfile _id to save
   * @returns {Promise<SavedChef>}
   */
  async saveChef(userId, chefId) {
    // Only allow saving approved chefs that are visible to clients
    const chef = await ChefProfile.findOne({
      _id: chefId,
      verificationStatus: 'approved',
    });

    if (!chef) {
      const error = new Error('Chef not found.');
      error.statusCode = 404;
      throw error;
    }

    try {
      const savedChef = await SavedChef.create({ client: userId, chef: chefId });
      return savedChef;
    } catch (err) {
      // MongoDB duplicate key error (E11000)
      if (err.code === 11000) {
        const error = new Error('You have already saved this chef.');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  /**
   * Remove a saved chef relationship for a client.
   *
   * @param {ObjectId|string} userId  – authenticated client's User _id
   * @param {string}          chefId  – ChefProfile _id to remove
   */
  async removeSavedChef(userId, chefId) {
    const result = await SavedChef.findOneAndDelete({
      client: userId,
      chef: chefId,
    });

    if (!result) {
      const error = new Error('Saved chef not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  /**
   * Get all chefs saved by a client, newest first.
   *
   * The chef field is deeply populated so the frontend can render chef cards
   * without any additional requests.
   *
   * @param {ObjectId|string} userId
   * @returns {Promise<SavedChef[]>}
   */
  async getSavedChefs(userId) {
    const savedChefs = await SavedChef.find({ client: userId })
      .populate({
        path: 'chef',
        // Select only the fields required for ChefCard rendering
        select:
          'user gallery rating totalReviews verificationStatus specialties cuisines serviceAreas pricePerPerson dietaryOptions bio yearsOfExperience availability',
        populate: {
          path: 'user',
          select: 'firstName lastName avatar',
        },
      })
      .sort({ createdAt: -1 });

    return savedChefs;
  }

  /**
   * Check whether a client has saved a specific chef.
   *
   * @param {ObjectId|string} userId
   * @param {string}          chefId
   * @returns {Promise<boolean>}
   */
  async checkSavedChef(userId, chefId) {
    const exists = await SavedChef.exists({ client: userId, chef: chefId });
    return Boolean(exists);
  }
}

export default new SavedChefService();
