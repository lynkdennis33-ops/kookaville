import User from '../models/User.js';
import ChefProfile from '../models/ChefProfile.js';
import Booking from '../models/Booking.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

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
}

export default new AdminService();
