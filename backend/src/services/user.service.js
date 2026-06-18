import User from '../models/User.js';

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
   * Allowed fields: firstName, lastName, phone, avatar, address, city, country, dateOfBirth
   */
  async updateUserProfile(userId, updateData) {
    // Define allowed fields for profile update
    const allowedFields = ['firstName', 'lastName', 'phone', 'avatar', 'address', 'city', 'country', 'dateOfBirth'];

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
