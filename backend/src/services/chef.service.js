import ChefProfile from '../models/ChefProfile.js';
import notificationService from './notification.service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';

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
      // gallery is intentionally excluded from profile creation.
      // Gallery images are managed through POST /api/chef/gallery and
      // DELETE /api/chef/gallery/:imageId which handle Cloudinary upload,
      // duplicate-prevention, and enforce the 20-image cap.
      gallery: [],
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
   * Allowed fields: bio, yearsOfExperience, specialties, cuisines, serviceAreas, pricePerPerson, availability
   * Note: gallery is intentionally excluded — use POST /api/chef/gallery and
   * DELETE /api/chef/gallery/:imageId which enforce the 20-image cap, handle
   * Cloudinary uploads, and store the required { url, publicId } structure.
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
    } else if (sort === 'ratingHigh') {
      sortOrder = { rating: -1 };
    } else if (sort === 'ratingLow') {
      sortOrder = { rating: 1 };
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
   * Supports keyword search, multiple filters, and pagination
   * Query parameters:
   * - keyword: search in bio, specialties, cuisines (case-insensitive)
   * - cuisine: filter by cuisine (exact match in array)
   * - serviceArea: filter by service area (exact match in array)
   * - dietary: filter by dietary option (exact match in dietaryOptions array)
   * - minPrice: minimum price per person
   * - maxPrice: maximum price per person
   * - minRating: minimum average rating (inclusive)
   * - page: page number (default: 1)
   * - limit: items per page (default: 10, max: 100)
   */
  async searchChefs(filters) {
    const { keyword, cuisine, serviceArea, dietary, minPrice, maxPrice, minRating, page, limit } = filters;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

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

    // Filter by dietary option (exact match in dietaryOptions array)
    if (dietary && dietary.trim()) {
      query.dietaryOptions = dietary.trim();
    }

    // Filter by minimum rating (chef average rating >= minRating)
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
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

    // Get total count for pagination metadata
    const totalItems = await ChefProfile.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Execute paginated query
    const chefs = await ChefProfile.find(query)
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

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

  /**
   * Update a chef profile's verification status (admin only)
   * Sends the chef a system notification on approval or rejection
   */
  async updateVerificationStatus(chefProfileId, status) {
    // Validate status value
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      const error = new Error(
        `Invalid verification status. Must be one of: ${allowed.join(', ')}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Update and return the latest profile in a single operation
    const chefProfile = await ChefProfile.findByIdAndUpdate(
      chefProfileId,
      { verificationStatus: status },
      { new: true, runValidators: true }
    );

    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // Notify the chef — system notification, no referenceId needed
    if (status === 'approved') {
      await notificationService.createNotification({
        recipient: chefProfile.user,
        title: 'Chef Profile Approved',
        message: 'Your chef profile has been approved.',
        type: 'system',
      });
    } else if (status === 'rejected') {
      await notificationService.createNotification({
        recipient: chefProfile.user,
        title: 'Chef Profile Rejected',
        message: 'Your chef profile was rejected.',
        type: 'system',
      });
    }

    return chefProfile;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gallery
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Upload one or more images to the authenticated chef's gallery.
   *
   * WHY upload logic lives in the service and not the controller:
   *   Controllers are responsible only for HTTP concerns: parsing the request
   *   and sending the response.  Deciding how many images are allowed, which
   *   Cloudinary folder to use, and how to persist the results are business
   *   rules that belong in the service layer so they can be tested and reused
   *   independently of the transport layer.
   *
   * @param {string}   userId  - Authenticated user's MongoDB _id
   * @param {Buffer[]} buffers - Array of raw image buffers from req.files
   * @returns {Promise<Array>} Updated gallery array
   */
  async addGalleryImages(userId, buffers) {
    const MAX_GALLERY_SIZE = 20;

    // 1. Locate the chef profile that belongs to the authenticated user.
    //    WHY we look up by user id: ownership check — a chef can only modify
    //    their own gallery.  Finding by user id implicitly ensures this because
    //    userId comes from the verified JWT, not from the request body.
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Enforce the gallery cap BEFORE uploading anything to Cloudinary.
    //    WHY: Uploading first and then rejecting wastes bandwidth and leaves
    //    orphaned assets in Cloudinary if we later refuse to save them.
    const currentCount = chefProfile.gallery.length;
    if (currentCount + buffers.length > MAX_GALLERY_SIZE) {
      const remaining = MAX_GALLERY_SIZE - currentCount;
      const error = new Error(
        `Gallery limit reached. You can upload at most ${remaining} more image(s). ` +
        `Current: ${currentCount}, limit: ${MAX_GALLERY_SIZE}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // 3. Upload every image to Cloudinary concurrently.
    //    Using Promise.all is safe here because each upload is independent.
    const uploaded = await Promise.all(
      buffers.map((buffer) => uploadToCloudinary(buffer, 'kookaville/gallery'))
    );

    // 4. Append each result to the gallery.
    //    uploadedAt defaults to Date.now() via the schema, so we do not need
    //    to set it explicitly — Mongoose will fill it on save.
    uploaded.forEach(({ url, publicId }) => {
      chefProfile.gallery.push({ url, publicId });
    });

    await chefProfile.save();

    return chefProfile.gallery;
  }

  /**
   * Delete one image from the authenticated chef's gallery.
   *
   * @param {string} userId   - Authenticated user's MongoDB _id
   * @param {string} imageId  - MongoDB _id of the gallery subdocument
   * @returns {Promise<void>}
   */
  async deleteGalleryImage(userId, imageId) {
    // 1. Find the chef profile — this doubles as an ownership check.
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Locate the gallery item by its MongoDB _id.
    //    WHY we use MongoDB _id instead of Cloudinary publicId for the route
    //    parameter: MongoDB _ids are stable, opaque to clients, and never
    //    expose Cloudinary internals in the API URL.
    const galleryItem = chefProfile.gallery.id(imageId);
    if (!galleryItem) {
      const error = new Error('Gallery image not found.');
      error.statusCode = 404;
      throw error;
    }

    // 3. Delete from Cloudinary BEFORE removing from MongoDB.
    //    WHY: If the MongoDB save fails after we delete from Cloudinary, the
    //    image is already gone from storage but still referenced in the DB,
    //    creating a broken link.  Deleting from Cloudinary first is the safer
    //    trade-off: in the rare case of a subsequent DB failure, the asset is
    //    already freed and the stale reference can be cleaned up on retry.
    //    Without this step, skipping Cloudinary deletion would leave orphaned
    //    assets that consume storage quota indefinitely.
    await deleteFromCloudinary(galleryItem.publicId);

    // 4. Remove the subdocument from the array and save.
    galleryItem.deleteOne();
    await chefProfile.save();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Certificates
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Upload a certificate file and add its metadata to the chef's profile.
   *
   * @param {string} userId     - Authenticated user's MongoDB _id
   * @param {Buffer} fileBuffer - Raw certificate bytes from req.file.buffer
   * @param {Object} metadata   - { title, issuer?, issueDate?, expiryDate? }
   * @returns {Promise<Object>} The newly created certificate subdocument
   */
  async uploadCertificate(userId, fileBuffer, metadata) {
    // 1. Locate the chef profile.
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Validate required metadata.
    if (!metadata.title || !metadata.title.trim()) {
      const error = new Error('Certificate title is required.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Upload the file to Cloudinary.
    const { url, publicId } = await uploadToCloudinary(
      fileBuffer,
      'kookaville/certificates'
    );

    // 4. Build the certificate subdocument.
    //    verificationStatus defaults to 'pending' via schema, so new uploads
    //    must be reviewed by admin before appearing on the public profile.
    const certificate = {
      title: metadata.title.trim(),
      issuer: metadata.issuer ? metadata.issuer.trim() : '',
      issueDate: metadata.issueDate || null,
      expiryDate: metadata.expiryDate || null,
      file: { url, publicId },
      // verificationStatus defaults to 'pending' in schema
      // uploadedAt defaults to Date.now() in schema
    };

    // 5. Append the certificate to the array and save.
    chefProfile.certificates.push(certificate);
    await chefProfile.save();

    // Return the newly created subdocument (with its auto-generated _id).
    return chefProfile.certificates[chefProfile.certificates.length - 1];
  }

  /**
   * Get all certificates belonging to the authenticated chef.
   *
   * @param {string} userId - Authenticated user's MongoDB _id
   * @returns {Promise<Array>} Array of certificate subdocuments
   */
  async getCertificates(userId) {
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    return chefProfile.certificates;
  }

  /**
   * Delete one certificate from the authenticated chef's profile.
   *
   * @param {string} userId         - Authenticated user's MongoDB _id
   * @param {string} certificateId  - MongoDB _id of the certificate subdocument
   * @returns {Promise<void>}
   */
  async deleteCertificate(userId, certificateId) {
    // 1. Find the chef profile — this doubles as an ownership check.
    const chefProfile = await ChefProfile.findOne({ user: userId });
    if (!chefProfile) {
      const error = new Error('Chef profile not found.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Locate the certificate by its MongoDB _id.
    const certificate = chefProfile.certificates.id(certificateId);
    if (!certificate) {
      const error = new Error('Certificate not found.');
      error.statusCode = 404;
      throw error;
    }

    // 3. Delete from Cloudinary BEFORE removing from MongoDB.
    //    WHY: If the MongoDB save fails after we delete from Cloudinary, the
    //    file is already gone from storage but still referenced in the DB,
    //    creating a broken link.  Deleting from Cloudinary first is the safer
    //    trade-off: in the rare case of a subsequent DB failure, the asset is
    //    already freed and the stale reference can be cleaned up on retry.
    //    Without this step, skipping Cloudinary deletion would leave orphaned
    //    files that consume storage quota indefinitely.
    await deleteFromCloudinary(certificate.file.publicId);

    // 4. Remove the subdocument from the array and save.
    certificate.deleteOne();
    await chefProfile.save();
  }
}

export default new ChefService();
