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

  /**
   * Upload one or more images to the chef's gallery.
   * Protected — chef role only.
   *
   * Controller responsibilities:
   *   - Confirm that multer attached at least one file
   *   - Delegate all upload and persistence logic to the service
   *   - Return the 201 response with the updated gallery
   */
  async addGalleryImages(req, res, next) {
    try {
      // Multer populates req.files (array) when using upload.array().
      // Reject the request early if no files were attached so we never
      // hit the service with an empty array.
      if (!req.files || req.files.length === 0) {
        const error = new Error('No files uploaded. Please attach at least one image with field name "images".');
        error.statusCode = 400;
        throw error;
      }

      const buffers = req.files.map((f) => f.buffer);
      const gallery = await chefService.addGalleryImages(req.user._id, buffers);

      res.status(201).json({
        success: true,
        message: 'Gallery updated successfully.',
        data: {
          gallery,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete one image from the chef's gallery.
   * Protected — chef role only.
   *
   * Controller responsibilities:
   *   - Forward the MongoDB imageId from the URL param to the service
   *   - Return 200 on success
   */
  async deleteGalleryImage(req, res, next) {
    try {
      const { imageId } = req.params;
      await chefService.deleteGalleryImage(req.user._id, imageId);

      res.status(200).json({
        success: true,
        message: 'Gallery image deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a certificate file with metadata.
   * Protected — chef role only.
   *
   * Controller responsibilities:
   *   - Confirm that multer attached a file
   *   - Extract metadata from the request body
   *   - Delegate all upload and persistence logic to the service
   *   - Return 201 with the newly created certificate
   */
  async uploadCertificate(req, res, next) {
    try {
      if (!req.file) {
        const error = new Error('No file uploaded. Please attach a certificate with field name "certificate".');
        error.statusCode = 400;
        throw error;
      }

      const { title, issuer, issueDate, expiryDate } = req.body;
      const certificate = await chefService.uploadCertificate(req.user._id, req.file.buffer, {
        title,
        issuer,
        issueDate,
        expiryDate,
      });

      res.status(201).json({
        success: true,
        message: 'Certificate uploaded successfully.',
        data: {
          certificate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all certificates for the authenticated chef.
   * Protected — chef role only.
   */
  async getCertificates(req, res, next) {
    try {
      const certificates = await chefService.getCertificates(req.user._id);

      res.status(200).json({
        success: true,
        data: {
          certificates,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete one certificate.
   * Protected — chef role only.
   * Only the owning chef may delete their own certificates.
   */
  async deleteCertificate(req, res, next) {
    try {
      const { certificateId } = req.params;
      await chefService.deleteCertificate(req.user._id, certificateId);

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChefController();
