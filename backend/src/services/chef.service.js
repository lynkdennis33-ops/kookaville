import ChefProfile from '../models/ChefProfile.js';

class ChefService {
  /**
   * Create a new chef profile for a user
   * Validates that the user doesn't already have a chef profile
   */
  async createChefProfile(userId, chefData) {
    // Check if user already has a chef profile
    const existingProfile = await ChefProfile.findOne({ user: userId });

    if (existingProfile) {
      const error = new Error('You have already submitted a chef profile.');
      error.statusCode = 409;
      throw error;
    }

    // Create new chef profile
    const chefProfile = new ChefProfile({
      user: userId,
      bio: chefData.bio,
      yearsOfExperience: chefData.yearsOfExperience,
      specialties: chefData.specialties,
      cuisines: chefData.cuisines || [],
      serviceAreas: chefData.serviceAreas,
      pricePerPerson: chefData.pricePerPerson,
      gallery: chefData.gallery || [],
      availability: chefData.availability || [],
      // verificationStatus defaults to 'pending' via schema default
    });

    await chefProfile.save();
    return chefProfile;
  }

  /**
   * Get chef profile by user ID
   */
  async getChefProfile(userId) {
    const chefProfile = await ChefProfile.findOne({ user: userId });

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    return chefProfile;
  }

  /**
   * Update chef profile with allowed fields only
   * Allowed fields: bio, yearsOfExperience, specialties, cuisines, serviceAreas, pricePerPerson, gallery, availability
   */
  async updateChefProfile(userId, updateData) {
    // Define allowed fields for profile update
    const allowedFields = [
      'bio',
      'yearsOfExperience',
      'specialties',
      'cuisines',
      'serviceAreas',
      'pricePerPerson',
      'gallery',
      'availability',
    ];

    // Filter update data to only include allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    // Update chef profile with filtered data
    const chefProfile = await ChefProfile.findOneAndUpdate(
      { user: userId },
      filteredData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    return chefProfile;
  }
}

export default new ChefService();
