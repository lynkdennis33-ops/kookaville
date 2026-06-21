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

  /**
   * Get all approved chefs for client discovery with pagination and sorting
   * Supports query parameters:
   * - page: page number (default: 1)
   * - limit: items per page (default: 10)
   * - sort: 'newest' (default), 'oldest', 'priceLow', 'priceHigh'
   */
  async getAllChefs(options = {}) {
    const { page = 1, limit = 10, sort = 'newest' } = options;

    // Convert to numbers and ensure valid values
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10)); // Cap at 100
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    let sortOrder = { createdAt: -1 }; // Default: newest
    if (sort === 'oldest') {
      sortOrder = { createdAt: 1 };
    } else if (sort === 'priceLow') {
      sortOrder = { pricePerPerson: 1 };
    } else if (sort === 'priceHigh') {
      sortOrder = { pricePerPerson: -1 };
    } else if (sort === "ratingHigh") {
    sortOrder = { averageRating: -1 };
    }
    else if (sort === "ratingLow") {
        sortOrder = { averageRating: 1 };
    }

    const query = { verificationStatus: 'approved' };

    // Get total count for pagination
    const totalItems = await ChefProfile.countDocuments(query);

    // Get paginated results
    const chefs = await ChefProfile.find(query)
      .populate('user', 'firstName lastName avatar')
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limitNum);

    return {
      chefs,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  /**
   * Get a specific chef profile by ChefProfile ID
   * Public route
   * Must have verificationStatus = 'approved'
   * Populates user field with firstName, lastName, avatar
   */
  async getChefById(chefProfileId) {
    const chef = await ChefProfile.findOne({
      _id: chefProfileId,
      verificationStatus: 'approved',
    }).populate('user', 'firstName lastName avatar');

    if (!chef) {
      const error = new Error('Chef not found.');
      error.statusCode = 404;
      throw error;
    }

    return chef;
  }

  /**
   * Search and filter approved chefs
   * Supports keyword search and multiple filters
   * Query parameters:
   * - keyword: search in bio, specialties, cuisines (case-insensitive)
   * - cuisine: filter by cuisine (exact match in array)
   * - serviceArea: filter by service area (exact match in array)
   * - minPrice: minimum price per person
   * - maxPrice: maximum price per person
   */
  async searchChefs(filters) {
    const { keyword, cuisine, serviceArea, minPrice, maxPrice } = filters;

    // Build MongoDB query
    const query = { verificationStatus: 'approved' };

    // Keyword search in bio, specialties, cuisines (case-insensitive)
    if (keyword && keyword.trim()) {
      query.$or = [
        { bio: { $regex: keyword, $options: 'i' } },
        { specialties: { $regex: keyword, $options: 'i' } },
        { cuisines: { $regex: keyword, $options: 'i' } },
      ];
    }

    // Filter by cuisine (exact match in cuisines array)
    if (cuisine && cuisine.trim()) {
      query.cuisines = cuisine.trim();
    }

    // Filter by service area (exact match in serviceAreas array)
    if (serviceArea && serviceArea.trim()) {
      query.serviceAreas = serviceArea.trim();
    }

    // Filter by price range
    const priceFilter = {};
    if (minPrice) {
      priceFilter.$gte = Number(minPrice);
    }
    if (maxPrice) {
      priceFilter.$lte = Number(maxPrice);
    }

    if (Object.keys(priceFilter).length > 0) {
      query.pricePerPerson = priceFilter;
    }

    // Execute query
    const chefs = await ChefProfile.find(query)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });

    return chefs;
  }

  /**
   * Get featured chefs for homepage/landing page
   * Returns first 6 approved chefs sorted by newest first
   */
  async getFeaturedChefs() {
    const chefs = await ChefProfile.find({ verificationStatus: 'approved' })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(6);

    return chefs;
  }
}

export default new ChefService();
