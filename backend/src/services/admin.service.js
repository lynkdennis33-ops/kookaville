import User from '../models/User.js';
import ChefProfile from '../models/ChefProfile.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import Category from '../models/Category.js';
import Menu from '../models/Menu.js';

/**
 * Admin Dashboard Service
 * Aggregates platform statistics for the admin dashboard
 * Uses efficient MongoDB queries (countDocuments, aggregate) to avoid loading unnecessary documents into memory
 */

class AdminService {
  /**
   * Gather all dashboard statistics
   * @returns {Object} Dashboard statistics object with users, chefs, bookings, payments, revenue, and recent activity
   */
  async getDashboardStatistics() {
    try {
      // Gather all statistics in parallel for better performance
      const [
        userStats,
        chefStats,
        bookingStats,
        paymentStats,
        revenueStats,
        recentActivity
      ] = await Promise.all([
        this._getUserStatistics(),
        this._getChefStatistics(),
        this._getBookingStatistics(),
        this._getPaymentStatistics(),
        this._getRevenueStatistics(),
        this._getRecentActivity()
      ]);

      return {
        users: userStats,
        chefs: chefStats,
        bookings: bookingStats,
        payments: paymentStats,
        revenue: revenueStats,
        recentActivity
      };
    } catch (error) {
      throw new Error(`Failed to fetch dashboard statistics: ${error.message}`);
    }
  }

  /**
   * Calculate user statistics
   * Uses countDocuments() to efficiently count users without loading them into memory
   * Counts by role and status fields
   * @private
   */
  async _getUserStatistics() {
    const [total, clients, chefs, admins, suspended] = await Promise.all([
      User.countDocuments({}), // Total users - no filter needed
      User.countDocuments({ role: 'client' }), // Count clients by role
      User.countDocuments({ role: 'chef' }), // Count chefs by role
      User.countDocuments({ role: 'admin' }), // Count admins by role
      User.countDocuments({ status: 'suspended' }) // Count suspended users by status
    ]);

    return {
      total,
      clients,
      chefs,
      admins,
      suspended
    };
  }

  /**
   * Calculate chef verification statistics
   * Counts chefs by their verification status
   * @private
   */
  async _getChefStatistics() {
    const [verified, pendingVerification, rejected] = await Promise.all([
      ChefProfile.countDocuments({ verificationStatus: 'approved' }), // Verified = approved
      ChefProfile.countDocuments({ verificationStatus: 'pending' }), // Pending verification
      ChefProfile.countDocuments({ verificationStatus: 'rejected' }) // Rejected (if applicable)
    ]);

    return {
      verified,
      pendingVerification,
      rejected
    };
  }

  /**
   * Calculate booking statistics
   * Counts bookings by their current status
   * @private
   */
  async _getBookingStatistics() {
    const [total, pending, accepted, completed, cancelled] = await Promise.all([
      Booking.countDocuments({}), // Total bookings
      Booking.countDocuments({ status: 'pending' }), // Pending bookings
      Booking.countDocuments({ status: 'accepted' }), // Accepted bookings
      Booking.countDocuments({ status: 'completed' }), // Completed bookings
      Booking.countDocuments({ status: 'cancelled' }) // Cancelled bookings
    ]);

    return {
      total,
      pending,
      accepted,
      completed,
      cancelled
    };
  }

  /**
   * Calculate payment statistics
   * Counts transactions by their status
   * @private
   */
  async _getPaymentStatistics() {
    const [pending, paid, failed, refunded] = await Promise.all([
      Transaction.countDocuments({ status: 'pending' }), // Pending transactions
      Transaction.countDocuments({ status: 'paid' }), // Paid transactions
      Transaction.countDocuments({ status: 'failed' }), // Failed transactions
      Transaction.countDocuments({ status: 'refunded' }) // Refunded transactions
    ]);

    return {
      pending,
      paid,
      failed,
      refunded
    };
  }

  /**
   * Calculate revenue statistics
   * Uses MongoDB aggregation to sum transaction amounts efficiently
   * Avoids loading entire collections into memory
   * Only counts PAID transactions toward gross revenue (excludes pending and failed)
   * @private
   */
  async _getRevenueStatistics() {
    // Aggregate paid transactions to calculate gross revenue
    // Aggregation pipeline is more efficient than loading all transactions into memory
    const paidTransactions = await Transaction.aggregate([
      {
        $match: { status: 'paid' } // Only count paid transactions - excludes pending/failed
      },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$amount' } // Sum of all paid transaction amounts
        }
      }
    ]);

    const grossRevenue = paidTransactions.length > 0 ? paidTransactions[0].grossRevenue : 0;

    // Calculate platform commission from completed payouts
    // Platform commission represents the fee charged per transaction
    const commissionStats = await Transaction.aggregate([
      {
        $match: { status: 'paid', payoutStatus: 'paid' } // Only from completed payouts
      },
      {
        $group: {
          _id: null,
          platformCommission: { $sum: '$platformCommission' } // Sum of platform commission field
        }
      }
    ]);

    const platformCommission = commissionStats.length > 0 ? commissionStats[0].platformCommission : 0;

    // Calculate pending payouts (ready to be paid out)
    // Sum amounts where payoutStatus is "ready"
    const pendingPayoutStats = await Transaction.aggregate([
      {
        $match: { payoutStatus: 'ready' } // Payouts ready to be processed
      },
      {
        $group: {
          _id: null,
          pendingPayouts: { $sum: '$payoutAmount' } // Sum of amounts pending payout
        }
      }
    ]);

    const pendingPayouts = pendingPayoutStats.length > 0 ? pendingPayoutStats[0].pendingPayouts : 0;

    // Calculate completed payouts (already paid out)
    // Sum amounts where payoutStatus is "paid"
    const completedPayoutStats = await Transaction.aggregate([
      {
        $match: { payoutStatus: 'paid' } // Payouts already completed
      },
      {
        $group: {
          _id: null,
          completedPayouts: { $sum: '$payoutAmount' } // Sum of amounts already paid out
        }
      }
    ]);

    const completedPayouts = completedPayoutStats.length > 0 ? completedPayoutStats[0].completedPayouts : 0;

    return {
      grossRevenue,
      platformCommission,
      pendingPayouts,
      completedPayouts
    };
  }

  /**
   * Build recent activity feed
   * Since no dedicated Activity model exists, we dynamically combine recent events from:
   * - Users (new registrations)
   * - Bookings (created, accepted, completed)
   * - Transactions (payments succeeded)
   * - ChefProfile (verifications)
   * Limited to 10 most recent activities for dashboard performance
   * Sorted by createdAt descending (newest first)
   * @private
   */
  async _getRecentActivity() {
    const activities = [];

    // Get latest 5 new user registrations
    // Each registration is an "activity" on the platform
    const newUsers = await User.find({})
      .select('email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    newUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        message: `New user registered: ${user.email}`,
        createdAt: user.createdAt
      });
    });

    // Get latest 5 bookings
    // Include both new bookings and status updates (accepted, completed)
    const recentBookings = await Booking.find({})
      .populate('client', 'email')
      .select('client status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    recentBookings.forEach(booking => {
      if (booking.status === 'completed') {
        activities.push({
          type: 'booking_completed',
          message: `Booking completed for ${booking.client?.email || 'client'}`,
          createdAt: booking.createdAt
        });
      } else if (booking.status === 'accepted') {
        activities.push({
          type: 'booking_accepted',
          message: `Booking accepted by chef for ${booking.client?.email || 'client'}`,
          createdAt: booking.createdAt
        });
      } else {
        activities.push({
          type: 'booking_created',
          message: `New booking created by ${booking.client?.email || 'client'}`,
          createdAt: booking.createdAt
        });
      }
    });

    // Get latest 5 successful payments
    // Only count "paid" status transactions as successful payments
    const successfulPayments = await Transaction.find({ status: 'paid' })
      .select('amount status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    successfulPayments.forEach(transaction => {
      activities.push({
        type: 'payment_succeeded',
        message: `Payment succeeded: $${(transaction.amount / 100).toFixed(2)}`,
        createdAt: transaction.createdAt
      });
    });

    // Get latest 5 verified chefs
    // Chefs with "approved" verification status
    const verifiedChefs = await ChefProfile.find({ verificationStatus: 'approved' })
      .populate('user', 'email')
      .select('user verificationStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    verifiedChefs.forEach(chef => {
      activities.push({
        type: 'chef_verified',
        message: `Chef verified: ${chef.user?.email || 'chef'}`,
        createdAt: chef.createdAt
      });
    });

    // Sort all activities by createdAt descending (newest first)
    // and limit to 10 most recent activities
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return activities.slice(0, 10);
  }

  /**
   * Get paginated, filtered, and sorted users
   * WHY pagination: Returns large datasets incrementally to reduce memory usage and network load.
   * Admin dashboard cannot render thousands of users at once — pagination enables efficient browsing.
   * WHY search with regex: Case-insensitive pattern matching enables flexible user lookup by name or email.
   * Exact string matching would require users to know precise capitalization or spelling.
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Records per page (default 20)
   * @param {string} search - Search term for firstName, lastName, or email
   * @param {string} role - Filter by role (client, chef, admin)
   * @param {string} status - Filter by status (active, suspended)
   * @param {string} sortBy - Field to sort by (createdAt, firstName, lastName, email)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Object} Users array with pagination metadata
   */
  async getUsers({ page = 1, limit = 20, search = '', role = '', status = '', sortBy = 'createdAt', order = 'desc' }) {
    try {
      // Build filter object
      const filter = {};

      // Add role filter if provided
      if (role) {
        filter.role = role;
      }

      // Add status filter if provided
      if (status) {
        if (status === 'suspended') {
          filter.isSuspended = true;
        } else if (status === 'active') {
          filter.isSuspended = false;
        }
      }

      // Add search filter using regex for case-insensitive matching
      // WHY regex: Enables flexible pattern matching across multiple fields without requiring exact case-sensitive matches
      if (search) {
        const searchRegex = new RegExp(search, 'i'); // 'i' flag for case-insensitive
        filter.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ];
      }

      // Validate and set sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      // WHY lean(): Returns plain JavaScript objects instead of full Mongoose documents
      // reduces memory usage and query time when we only need to display user data
      const [users, totalUsers] = await Promise.all([
        User.find(filter)
          .select('-password') // Exclude password field
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        User.countDocuments(filter) // Count total matching documents
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalUsers / limit);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalUsers,
          totalPages
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Suspend a user account
   * WHY we cannot suspend admins: Admin accounts must remain accessible for emergency platform administration.
   * Suspending the last admin would lock out all administrative functions.
   * WHY we store audit information: Complete suspension record enables admins to review the decision,
   * see who took the action and when, and supports appeal/reversal workflows.
   * WHY we create notifications: Users deserve to know their account is suspended and why.
   * Notifications enable users to contact support or understand platform policies.
   * @param {string} userId - ID of user to suspend
   * @param {string} adminId - ID of admin performing the suspension
   * @param {string} reason - Reason for suspension
   * @returns {Object} Suspended user data
   */
  async suspendUser(userId, adminId, reason) {
    try {
      // Find the user to suspend
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Prevent suspending admins
      // WHY: Admins must remain accessible for emergency platform administration
      if (user.role === 'admin') {
        throw new Error('Admin accounts cannot be suspended');
      }

      // Reject if already suspended
      if (user.isSuspended) {
        throw new Error('User is already suspended');
      }

      // Update user suspension fields
      user.isSuspended = true;
      user.suspendedAt = new Date();
      user.suspendedBy = adminId;
      user.suspensionReason = reason;

      // Save updated user
      await user.save();

      // Create notification for the suspended user
      // WHY notifications: Users need to know why their account was suspended
      // and should be able to contact support if needed
      await Notification.create({
        recipient: userId,
        title: 'Account Suspended',
        message: `Your account has been suspended.\n\nReason: ${reason}`,
        type: 'system'
      });

      // Return suspended user (without password)
      return user.toJSON();
    } catch (error) {
      throw new Error(`Failed to suspend user: ${error.message}`);
    }
  }

  /**
   * Unsuspend a user account
   * Restores full account access and clears all suspension audit fields.
   * @param {string} userId - ID of user to unsuspend
   * @returns {Object} Unsuspended user data
   */
  async unsuspendUser(userId) {
    try {
      // Find the user to unsuspend
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Reject if user is not suspended
      if (!user.isSuspended) {
        throw new Error('User is not suspended');
      }

      // Reset suspension fields
      user.isSuspended = false;
      user.suspendedAt = null;
      user.suspendedBy = null;
      user.suspensionReason = '';

      // Save updated user
      await user.save();

      // Create notification for the unsuspended user
      // Users should know their account has been restored
      await Notification.create({
        recipient: userId,
        title: 'Account Reactivated',
        message: 'Your account has been restored and is now active.',
        type: 'system'
      });

      // Return unsuspended user (without password)
      return user.toJSON();
    } catch (error) {
      throw new Error(`Failed to unsuspend user: ${error.message}`);
    }
  }

  /**
   * Get paginated pending chef applications
   * Returns chefs with verificationStatus = "pending" with associated user data.
   * WHY pagination: Enables efficient browsing of pending applications without loading entire collection.
   * WHY search with regex: Allows flexible case-insensitive matching across name and email fields.
   * WHY we populate User: Admin needs to see full name and email for verification decision.
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Records per page (default 20)
   * @param {string} search - Search term for firstName, lastName, or email
   * @param {string} sortBy - Field to sort by (createdAt, yearsOfExperience)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Object} Pending chefs with pagination metadata
   */
  async getPendingChefs({ page = 1, limit = 20, search = '', sortBy = 'createdAt', order = 'desc' }) {
    try {
      // Build filter for pending verifications only
      const filter = { verificationStatus: 'pending' };

      // Add search filter using regex for case-insensitive matching
      // WHY regex: Enables flexible pattern matching across multiple fields without requiring exact case-sensitive matches
      if (search) {
        const searchRegex = new RegExp(search, 'i'); // 'i' flag for case-insensitive
        // Search in related User document fields via $or with populate
        // Note: Since we can't query on populated fields directly, we'll filter after population
        // This is acceptable for smaller pending applications list
      }

      // Validate and set sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with user population
      // WHY populate: Admin needs to see chef's name and email for verification decision
      let query = ChefProfile.find(filter)
        .populate('user', 'firstName lastName email avatar') // Get user's name and email
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

      let chefs = await query.lean();

      // Apply search filter on populated user data if search term provided
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        chefs = chefs.filter(chef => {
          if (!chef.user) return false;
          return (
            searchRegex.test(chef.user.firstName) ||
            searchRegex.test(chef.user.lastName) ||
            searchRegex.test(chef.user.email)
          );
        });
      }

      // Get total count for pagination
      const totalChefs = await ChefProfile.countDocuments(filter);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalChefs / limit);

      return {
        chefs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalChefs,
          totalPages
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch pending chefs: ${error.message}`);
    }
  }

  /**
   * Verify a chef account
   * Sets verificationStatus to "approved" and records audit information.
   * WHY we store verification audit: Enables accountability and allows review of verification decisions.
   * WHY we notify the chef: Chefs need to know they're verified and can now receive bookings.
   * WHY we don't delete documents: Documents should be retained for record-keeping and future references.
   * @param {string} chefId - ID of ChefProfile to verify
   * @param {string} adminId - ID of admin performing verification
   * @returns {Object} Verified chef profile data
   */
  async verifyChef(chefId, adminId) {
    try {
      // Find the chef profile
      const chef = await ChefProfile.findById(chefId).populate('user', 'email');
      if (!chef) {
        throw new Error('Chef profile not found');
      }

      // Reject if already approved
      if (chef.verificationStatus === 'approved') {
        throw new Error('Chef is already verified');
      }

      // Update verification status and audit fields
      chef.verificationStatus = 'approved';
      chef.verifiedBy = adminId;
      chef.verifiedAt = new Date();
      chef.verificationNotes = ''; // Clear notes on approval

      // Save updated chef profile
      await chef.save();

      // Create notification for the verified chef
      // WHY notification: Chefs deserve to know they've been verified and can accept bookings
      await Notification.create({
        recipient: chef.user._id,
        title: 'Chef Account Verified',
        message: 'Congratulations!\n\nYour chef account has been verified.\n\nYou may now receive bookings.',
        type: 'system'
      });

      return chef.toObject();
    } catch (error) {
      throw new Error(`Failed to verify chef: ${error.message}`);
    }
  }

  /**
   * Reject a chef verification
   * Sets verificationStatus to "rejected" and records audit information with reason.
   * WHY rejection requires reason: Chefs need to know what was wrong so they can fix it and reapply.
   * WHY we store the reason: Enables consistency in verification decisions and supports appeal workflows.
   * WHY we don't delete documents: Chefs should be able to correct issues and resubmit. Keep history intact.
   * WHY we notify the chef: Users need to know why their application was rejected.
   * @param {string} chefId - ID of ChefProfile to reject
   * @param {string} adminId - ID of admin performing rejection
   * @param {string} reason - Reason for rejection
   * @returns {Object} Rejected chef profile data
   */
  async rejectChef(chefId, adminId, reason) {
    try {
      // Validate reason is provided
      if (!reason || reason.trim() === '') {
        throw new Error('Rejection reason is required');
      }

      // Find the chef profile
      const chef = await ChefProfile.findById(chefId).populate('user', 'email');
      if (!chef) {
        throw new Error('Chef profile not found');
      }

      // Reject if already rejected
      if (chef.verificationStatus === 'rejected') {
        throw new Error('Chef verification is already rejected');
      }

      // Update verification status and audit fields
      chef.verificationStatus = 'rejected';
      chef.verifiedBy = adminId;
      chef.verifiedAt = new Date();
      chef.verificationNotes = reason; // Store rejection reason in notes

      // Save updated chef profile
      await chef.save();

      // Create notification for the rejected chef
      // WHY notification: Chefs need to know their application was rejected and why
      // This enables them to address the issue and resubmit
      await Notification.create({
        recipient: chef.user._id,
        title: 'Chef Verification Rejected',
        message: `Your verification request has been rejected.\n\nReason: ${reason}`,
        type: 'system'
      });

      return chef.toObject();
    } catch (error) {
      throw new Error(`Failed to reject chef: ${error.message}`);
    }
  }

  /**
   * Get paginated, filtered, and sorted categories
   * WHY pagination: Enables efficient browsing of large category lists without loading entire collection.
   * WHY search with regex: Case-insensitive pattern matching enables flexible category lookup.
   * WHY menuCount: Admin needs visibility into which categories are in active use.
   * Categories with high menu counts require careful deactivation decisions.
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Records per page (default 20)
   * @param {string} search - Search term for category name
   * @param {string} sortBy - Field to sort by (name, createdAt)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Object} Categories with pagination metadata
   */
  async getCategories({ page = 1, limit = 20, search = '', sortBy = 'name', order = 'asc' }) {
    try {
      // Build filter object
      const filter = {};

      // Add search filter using regex for case-insensitive matching
      // WHY regex: Enables flexible pattern matching without requiring exact case-sensitive matches
      if (search) {
        const searchRegex = new RegExp(search, 'i'); // 'i' flag for case-insensitive
        filter.name = searchRegex;
      }

      // Validate and set sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute aggregation pipeline to include menuCount
      // WHY aggregation: Efficiently counts related Menu documents at database level
      // instead of fetching documents and counting in JavaScript
      const categories = await Category.aggregate([
        { $match: filter },
        { $sort: sortObj },
        {
          $lookup: {
            from: 'menus',
            localField: '_id',
            foreignField: 'category',
            as: 'menus'
          }
        },
        {
          $project: {
            id: '$_id',
            _id: 1,
            name: 1,
            slug: 1,
            image: 1,
            isActive: 1,
            menuCount: { $size: '$menus' },
            createdAt: 1
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      // Get total count for pagination
      const totalCategories = await Category.countDocuments(filter);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCategories / limit);

      return {
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCategories,
          totalPages
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }

  /**
   * Create a new category
   * WHY we trim whitespace: Prevents leading/trailing spaces that would create inconsistent categories.
   * WHY we prevent duplicates: Duplicate category names confuse users and admins.
   * WHY we generate slug: Slugs provide SEO-friendly URLs and human-readable identifiers.
   * WHY we store createdBy: Audit trail enables tracking administrative decisions.
   * @param {string} name - Category name
   * @param {string} image - Optional image URL
   * @param {string} adminId - ID of admin creating the category
   * @returns {Object} Created category data
   */
  async createCategory(name, image = '', adminId) {
    try {
      // Trim and validate name
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }

      // Create new category
      // Slug will be auto-generated by the model's pre-save hook
      const category = new Category({
        name: trimmedName,
        image: image.trim(),
        createdBy: adminId,
        isActive: true
      });

      // Save category (pre-save hook generates slug and checks for duplicates)
      await category.save();

      return category.toObject();
    } catch (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }
  }

  /**
   * Update a category
   * Allows updating name and image.
   * If name changes, slug is automatically regenerated.
   * @param {string} categoryId - ID of category to update
   * @param {Object} updateData - Data to update (name, image)
   * @returns {Object} Updated category data
   */
  async updateCategory(categoryId, updateData) {
    try {
      // Find the category
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Update allowed fields
      if (updateData.name !== undefined) {
        category.name = updateData.name.trim();
        if (!category.name) {
          throw new Error('Category name cannot be empty');
        }
      }

      if (updateData.image !== undefined) {
        category.image = updateData.image.trim();
      }

      // Save category (pre-save hook regenerates slug if name changed and checks for duplicates)
      await category.save();

      return category.toObject();
    } catch (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }
  }

  /**
   * Soft delete a category
   * Sets isActive = false instead of removing the document.
   * WHY soft delete: Preserves category history and relationships with existing menus.
   * Deleted categories can be reactivated if needed without losing audit trail.
   * Hard delete would break references and lose historical data.
   * Checks if category is in use by any menus before deactivating.
   * @param {string} categoryId - ID of category to delete
   * @returns {Object} Updated category data
   */
  async deleteCategory(categoryId) {
    try {
      // Find the category
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      // Check if category is used by any menus
      // WHY check usage: Prevents breaking menu references and maintains data consistency
      const menuCount = await Menu.countDocuments({ category: categoryId });
      if (menuCount > 0) {
        throw new Error(`Cannot deactivate category because it is currently assigned to ${menuCount} menu(s)`);
      }

      // Perform soft delete by marking inactive
      category.isActive = false;
      await category.save();

      return category.toObject();
    } catch (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Get paginated, filtered, and sorted bookings
   * WHY pagination: Enables efficient browsing of large booking lists without loading entire collection into memory.
   * WHY populate: Admin needs to see full client/chef/menu details for booking context and support decisions.
   * WHY filtering improves support: Admins can quickly find bookings by status, payment, chef, or date range.
   * WHY admins have read-only access: Prevents accidental modifications; write operations are handled separately.
   * WHY searching by booking number is useful: Enables fast lookup by confirmation number for customer support.
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Records per page (default 20)
   * @param {string} search - Search term for client name/email or chef name
   * @param {string} status - Filter by booking status (pending, accepted, rejected, completed, cancelled)
   * @param {string} paymentStatus - Filter by payment status (pending, paid, failed, refunded)
   * @param {string} chefId - Filter by chef ID
   * @param {string} clientId - Filter by client ID
   * @param {string} dateFrom - Filter bookings from this date (ISO format)
   * @param {string} dateTo - Filter bookings until this date (ISO format)
   * @param {string} sortBy - Field to sort by (createdAt, bookingDate, status, paymentStatus, price)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Object} Bookings with pagination metadata
   */
  async getBookings({
    page = 1,
    limit = 20,
    search = '',
    status = '',
    paymentStatus = '',
    chefId = '',
    clientId = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'createdAt',
    order = 'desc'
  }) {
    try {
      // Build filter object
      const filter = {};

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      // Add payment status filter if provided
      if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
      }

      // Add chef filter if provided
      if (chefId) {
        filter.chef = chefId;
      }

      // Add client filter if provided
      if (clientId) {
        filter.client = clientId;
      }

      // Add date range filters if provided
      if (dateFrom || dateTo) {
        filter.bookingDate = {};
        if (dateFrom) {
          filter.bookingDate.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          // Add 1 day to dateTo to include bookings on that entire day
          const endDate = new Date(dateTo);
          endDate.setDate(endDate.getDate() + 1);
          filter.bookingDate.$lt = endDate;
        }
      }

      // Validate and set sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build search query for flexible booking lookup
      // WHY search is flexible: Admins should be able to find bookings by client name, email, or chef name
      // without knowing the exact field. This enables faster customer support.
      if (search) {
        // Search in related documents using $or with regex
        // We need to use aggregation for complex text search
        filter.$or = [
          { 'client.firstName': new RegExp(search, 'i') },
          { 'client.lastName': new RegExp(search, 'i') },
          { 'client.email': new RegExp(search, 'i') },
          { 'chef.user.firstName': new RegExp(search, 'i') },
          { 'chef.user.lastName': new RegExp(search, 'i') }
        ];
      }

      // Execute query with population
      // WHY we populate: Admin needs to see all related data for context
      const [bookings, totalBookings] = await Promise.all([
        Booking.find(filter)
          .populate('client', 'firstName lastName email')
          .populate({
            path: 'chef',
            select: 'user',
            populate: {
              path: 'user',
              select: 'firstName lastName'
            }
          })
          .populate('menu', 'name price')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Booking.countDocuments(filter)
      ]);

      // Apply search filtering on populated data if search term provided and $or wasn't set
      // (Since we can't query on populated fields directly for simple search)
      let filteredBookings = bookings;
      if (search && !filter.$or) {
        const searchRegex = new RegExp(search, 'i');
        filteredBookings = bookings.filter(booking => {
          const clientMatch = (
            searchRegex.test(booking.client?.firstName || '') ||
            searchRegex.test(booking.client?.lastName || '') ||
            searchRegex.test(booking.client?.email || '')
          );
          const chefMatch = (
            searchRegex.test(booking.chef?.user?.firstName || '') ||
            searchRegex.test(booking.chef?.user?.lastName || '')
          );
          return clientMatch || chefMatch;
        });
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalBookings / limit);

      return {
        bookings: filteredBookings,
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
          totalBookings,
          totalPages
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }

  /**
   * Get a single booking with all details
   * Returns detailed booking information including client, chef, menu, and transaction (if exists).
   * WHY we populate transaction: Admin needs payment details to troubleshoot payment issues.
   * @param {string} bookingId - ID of booking to retrieve
   * @returns {Object} Detailed booking data with all relationships
   */
  async getBookingById(bookingId) {
    try {
      // Find booking and populate all related data
      const booking = await Booking.findById(bookingId)
        .populate('client', 'firstName lastName email phone address')
        .populate({
          path: 'chef',
          populate: {
            path: 'user',
            select: 'firstName lastName email phone'
          }
        })
        .populate('menu', 'name description price')
        .lean();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Try to find associated transaction
      const transaction = await Transaction.findOne({ booking: bookingId }).lean();

      return {
        ...booking,
        transaction: transaction || null
      };
    } catch (error) {
      throw new Error(`Failed to fetch booking: ${error.message}`);
    }
  }

  /**
   * Get paginated, filtered, and sorted transactions
   * WHY financial records are immutable: Prevents fraud and maintains audit trail integrity.
   * All transactions should be read-only to preserve historical accuracy.
   * WHY only paid transactions count toward revenue: Pending/failed payments haven't completed.
   * Revenue is only realized when payment is successful and settled.
   * WHY populate is useful for admins: Enables troubleshooting without additional queries.
   * Admin can see booking/client/chef context directly in transaction view.
   * WHY pagination is necessary: Transaction lists can grow very large; pagination prevents memory overload.
   * WHY summary statistics improve dashboard performance: Aggregated stats are faster than computing on each page load.
   * @param {number} page - Page number (default 1)
   * @param {number} limit - Records per page (default 20)
   * @param {string} status - Filter by transaction status (pending, paid, failed, refunded)
   * @param {string} payoutStatus - Filter by payout status (pending, ready, paid)
   * @param {string} clientId - Filter by client ID
   * @param {string} chefId - Filter by chef ID
   * @param {string} startDate - Filter transactions from this date (ISO format)
   * @param {string} endDate - Filter transactions until this date (ISO format)
   * @param {string} search - Search term for transaction details
   * @param {string} sortBy - Field to sort by (createdAt, amount, status, commissionAmount, chefAmount, payoutStatus)
   * @param {string} order - Sort order (asc, desc)
   * @returns {Object} Transactions with pagination metadata and payment summary
   */
  async getTransactions({
    page = 1,
    limit = 20,
    status = '',
    payoutStatus = '',
    clientId = '',
    chefId = '',
    startDate = '',
    endDate = '',
    search = '',
    sortBy = 'createdAt',
    order = 'desc'
  }) {
    try {
      // Build filter object
      const filter = {};

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      // Add payout status filter if provided
      if (payoutStatus) {
        filter.payoutStatus = payoutStatus;
      }

      // Add client filter if provided
      if (clientId) {
        // Need to query through booking relationship
        const bookings = await Booking.find({ client: clientId }).select('_id').lean();
        const bookingIds = bookings.map(b => b._id);
        filter.booking = { $in: bookingIds };
      }

      // Add chef filter if provided
      if (chefId) {
        // Need to query through booking relationship
        const bookings = await Booking.find({ chef: chefId }).select('_id').lean();
        const bookingIds = bookings.map(b => b._id);
        filter.booking = { $in: bookingIds };
      }

      // Add date range filters if provided
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          // Add 1 day to endDate to include transactions on that entire day
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          filter.createdAt.$lt = end;
        }
      }

      // Validate and set sort order
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortObj = {};
      sortObj[sortBy] = sortOrder;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with population
      // WHY we populate: Admin needs to see booking, client, and chef details in transaction view
      const [transactions, totalTransactions] = await Promise.all([
        Transaction.find(filter)
          .populate({
            path: 'booking',
            select: 'bookingDate status'
          })
          .populate('client', 'firstName lastName email')
          .populate({
            path: 'chef',
            select: 'user',
            populate: {
              path: 'user',
              select: 'firstName lastName'
            }
          })
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Transaction.countDocuments(filter)
      ]);

      // Apply search filtering on populated data if search term provided
      // Search by transaction ID, client name/email, chef name, or stripePaymentIntentId
      let filteredTransactions = transactions;
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filteredTransactions = transactions.filter(transaction => {
          const idMatch = searchRegex.test(transaction._id?.toString() || '');
          const clientMatch = (
            searchRegex.test(transaction.client?.firstName || '') ||
            searchRegex.test(transaction.client?.lastName || '') ||
            searchRegex.test(transaction.client?.email || '')
          );
          const chefMatch = (
            searchRegex.test(transaction.chef?.user?.firstName || '') ||
            searchRegex.test(transaction.chef?.user?.lastName || '')
          );
          const stripeMatch = searchRegex.test(transaction.stripePaymentIntentId || '');
          return idMatch || clientMatch || chefMatch || stripeMatch;
        });
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalTransactions / limit);

      // Calculate payment summary statistics
      // WHY only paid transactions: Revenue is only realized when payment succeeds
      const summary = await this._getPaymentSummary();

      return {
        transactions: filteredTransactions,
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(limit),
          totalTransactions,
          totalPages
        },
        summary
      };
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }
  }

  /**
   * Get a single transaction with all details
   * Returns complete transaction information including related booking, client, and chef.
   * WHY financial records are read-only: Prevents tampering with payment history.
   * Transactions must remain immutable to maintain accurate financial records.
   * @param {string} transactionId - ID of transaction to retrieve
   * @returns {Object} Complete transaction data with all relationships
   */
  async getTransactionById(transactionId) {
    try {
      // Find transaction and populate all related data
      const transaction = await Transaction.findById(transactionId)
        .populate({
          path: 'booking',
          populate: {
            path: 'client',
            select: 'firstName lastName email phone'
          }
        })
        .populate('client', 'firstName lastName email phone address')
        .populate({
          path: 'chef',
          populate: {
            path: 'user',
            select: 'firstName lastName email phone'
          }
        })
        .lean();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * Calculate payment summary statistics
   * Returns dashboard summary of payment metrics.
   * Only includes transactions with status = "paid" in revenue calculations.
   * @private
   * @returns {Object} Payment summary statistics
   */
  async _getPaymentSummary() {
    try {
      // Get total transactions count
      const totalTransactions = await Transaction.countDocuments({});

      // Count by status
      const [pendingCount, paidCount, failedCount, refundedCount] = await Promise.all([
        Transaction.countDocuments({ status: 'pending' }),
        Transaction.countDocuments({ status: 'paid' }),
        Transaction.countDocuments({ status: 'failed' }),
        Transaction.countDocuments({ status: 'refunded' })
      ]);

      // Aggregate revenue, commission, and earnings from PAID transactions only
      // WHY only paid: Revenue and earnings are only realized when payment succeeds
      const revenueStats = await Transaction.aggregate([
        {
          $match: { status: 'paid' }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            platformCommission: { $sum: '$commissionAmount' },
            chefEarnings: { $sum: '$chefAmount' }
          }
        }
      ]);

      const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
      const platformCommission = revenueStats.length > 0 ? revenueStats[0].platformCommission : 0;
      const chefEarnings = revenueStats.length > 0 ? revenueStats[0].chefEarnings : 0;

      // Count by payout status
      const [readyCount, paidOutCount] = await Promise.all([
        Transaction.countDocuments({ payoutStatus: 'ready' }),
        Transaction.countDocuments({ payoutStatus: 'paid' })
      ]);

      return {
        totalRevenue,
        platformCommission,
        chefEarnings,
        totalTransactions,
        pendingTransactions: pendingCount,
        paidTransactions: paidCount,
        failedTransactions: failedCount,
        refundedTransactions: refundedCount,
        readyForPayout: readyCount,
        paidOut: paidOutCount
      };
    } catch (error) {
      throw new Error(`Failed to calculate payment summary: ${error.message}`);
    }
  }
}

export default new AdminService();
