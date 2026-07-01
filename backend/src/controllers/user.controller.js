import userService from '../services/user.service.js';

class UserController {
  /**
   * Get currently authenticated user's profile
   * Protected route
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getUserProfile(req.user._id);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * Protected route
   * Allows updating: firstName, lastName, phone, avatar, address, city, country, dateOfBirth
   */
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateUserProfile(req.user._id, req.body);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        error.statusCode = 404;
      }
      next(error);
    }
  }

  /**
   * Change user password
   * Protected route
   * Request body: { currentPassword, newPassword }
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        const error = new Error('Current password and new password are required');
        error.statusCode = 400;
        throw error;
      }

      const result = await userService.changePassword(req.user._id, currentPassword, newPassword);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user account
   * Protected route
   * Sets status to "inactive" instead of deleting
   */
  async deactivateAccount(req, res, next) {
    try {
      const result = await userService.deactivateAccount(req.user._id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile picture
   * Protected route — every authenticated user (client, chef, admin) can update
   * their own avatar.
   *
   * Responsibilities (controller layer only):
   *   - Validate that a file was attached to the request
   *   - Delegate all upload and persistence logic to the service
   *   - Return the standardised success response
   */
  async updateProfilePicture(req, res, next) {
    try {
      // Validate that multer placed a file on the request.
      // If no file is present the request is malformed and we reject it early
      // before touching the database or Cloudinary.
      if (!req.file) {
        const error = new Error('No file uploaded. Please attach an image with field name "avatar".');
        error.statusCode = 400;
        throw error;
      }

      const avatar = await userService.updateProfilePicture(req.user._id, req.file.buffer);

      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully.',
        data: {
          avatar,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
