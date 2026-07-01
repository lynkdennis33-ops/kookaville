import User from '../models/User.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload.js';

class UserService {
  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Update user profile with allowed fields only
   * Allowed fields: firstName, lastName, phone, address, city, country, dateOfBirth
   * Note: avatar is intentionally excluded — use the dedicated PATCH /profile-picture
   * endpoint which handles Cloudinary upload, old-image deletion, and stores both
   * url and publicId as required by the avatar schema.
   */
  async updateUserProfile(userId, updateData) {
    // Define allowed fields for profile update
    const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'city', 'country', 'dateOfBirth'];

    // Filter update data to only include allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData.hasOwnProperty(field)) {
        filteredData[field] = updateData[field];
      }
    });

    // Update user with filtered data
    const user = await User.findByIdAndUpdate(userId, filteredData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Change user password
   * Verifies current password and updates with new password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Fetch user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    // Validate new password length
    if (newPassword.length < 8) {
      const error = new Error('New password must be at least 8 characters');
      error.statusCode = 400;
      throw error;
    }

    // Update password
    user.password = newPassword;
    await user.save(); // Triggers pre('save') hook to hash password

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  /**
   * Update the authenticated user's profile picture.
   *
   * WHY upload logic lives here instead of in the controller:
   *   Controllers should stay thin and only handle HTTP concerns (parsing the
   *   request, sending the response, forwarding errors).  Business logic —
   *   deciding whether to delete an old image, which Cloudinary folder to use,
   *   and how to persist the result — belongs in the service layer so it can be
   *   tested and reused independently of the HTTP transport.
   *
   * @param {string} userId    - Authenticated user's MongoDB _id
   * @param {Buffer} fileBuffer - Raw image bytes from req.file.buffer
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async updateProfilePicture(userId, fileBuffer) {
    // 1. Locate the user so we can read their current avatar before replacing it.
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Delete the previous Cloudinary image BEFORE uploading the new one.
    //    WHY: Every upload creates a new asset.  Without deleting the old file
    //    first, the previous image becomes an orphan — still consuming storage
    //    but unreachable through the database.  Deleting before uploading keeps
    //    the Cloudinary account clean and avoids runaway storage costs.
    if (user.avatar && user.avatar.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    // 3. Upload the new image into the profile-pictures folder.
    //    The helper streams the buffer directly to Cloudinary without writing
    //    a temporary file to disk.
    const { url, publicId } = await uploadToCloudinary(
      fileBuffer,
      'kookaville/profile-pictures'
    );

    // 4. Persist both url and publicId.
    //    WHY publicId is stored: Cloudinary deletes assets by public_id, not by
    //    URL.  Storing only the URL makes future replacements fragile because
    //    the public_id must then be parsed out of the URL string.
    user.avatar = { url, publicId };
    await user.save();

    return { url, publicId };
  }

  /**
   * Deactivate user account
   * Sets status to "inactive" instead of deleting the document
   */
  async deactivateAccount(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'inactive' },
      { new: true }
    ).select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: 'Account deactivated successfully.',
    };
  }
}

export default new UserService();
