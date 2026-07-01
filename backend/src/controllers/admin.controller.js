import adminService from '../services/admin.service.js';

/**
 * Admin Controller
 * Handles admin dashboard endpoints
 * Thin controller - delegates business logic to service layer
 */

class AdminController {
  /**
   * Get admin dashboard statistics
   * @route GET /api/admin/dashboard
   * @access Protected - Admin only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDashboard(req, res, next) {
    try {
      // Call service to gather all dashboard statistics
      const dashboardData = await adminService.getDashboardStatistics();

      // Return formatted response
      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get paginated, filtered, and sorted users
   * @route GET /api/admin/users
   * @access Protected - Admin only
   * @query {number} page - Page number (default 1)
   * @query {number} limit - Records per page (default 20)
   * @query {string} search - Search term for firstName, lastName, or email
   * @query {string} role - Filter by role (client, chef, admin)
   * @query {string} status - Filter by status (active, suspended)
   * @query {string} sortBy - Field to sort by (createdAt, firstName, lastName, email)
   * @query {string} order - Sort order (asc, desc)
   * @returns {Object} Paginated users with pagination metadata
   */
  async getUsers(req, res, next) {
    try {
      // Extract query parameters from request
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        status = '',
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Call service to fetch paginated users
      const result = await adminService.getUsers({
        page,
        limit,
        search,
        role,
        status,
        sortBy,
        order
      });

      // Return formatted response with users and pagination
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend a user account
   * @route PATCH /api/admin/users/:userId/suspend
   * @access Protected - Admin only
   * @body {string} reason - Reason for suspension
   * @returns {Object} Suspended user data
   */
  async suspendUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      // Validate reason is provided
      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Suspension reason is required'
        });
      }

      // Call service to suspend user
      const suspendedUser = await adminService.suspendUser(userId, req.user._id, reason);

      // Return success response with suspended user
      res.status(200).json({
        success: true,
        message: 'User suspended successfully',
        data: suspendedUser
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (error.message.includes('already suspended')) {
        return res.status(400).json({
          success: false,
          message: 'User is already suspended'
        });
      }
      if (error.message.includes('Admin accounts cannot be suspended')) {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts cannot be suspended'
        });
      }
      next(error);
    }
  }

  /**
   * Unsuspend a user account
   * @route PATCH /api/admin/users/:userId/unsuspend
   * @access Protected - Admin only
   * @returns {Object} Unsuspended user data
   */
  async unsuspendUser(req, res, next) {
    try {
      const { userId } = req.params;

      // Call service to unsuspend user
      const unsuspendedUser = await adminService.unsuspendUser(userId);

      // Return success response with unsuspended user
      res.status(200).json({
        success: true,
        message: 'User unsuspended successfully',
        data: unsuspendedUser
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (error.message.includes('not suspended')) {
        return res.status(400).json({
          success: false,
          message: 'User is not suspended'
        });
      }
      next(error);
    }
  }

  /**
   * Get paginated pending chef applications
   * @route GET /api/admin/chefs/pending
   * @access Protected - Admin only
   * @query {number} page - Page number (default 1)
   * @query {number} limit - Records per page (default 20)
   * @query {string} search - Search term for firstName, lastName, or email
   * @query {string} sortBy - Field to sort by (createdAt, yearsOfExperience)
   * @query {string} order - Sort order (asc, desc)
   * @returns {Object} Paginated pending chefs with pagination metadata
   */
  async getPendingChefs(req, res, next) {
    try {
      // Extract query parameters
      const {
        page = 1,
        limit = 20,
        search = '',
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Call service to fetch pending chefs
      const result = await adminService.getPendingChefs({
        page,
        limit,
        search,
        sortBy,
        order
      });

      // Return formatted response with chefs and pagination
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify a chef account
   * @route PATCH /api/admin/chefs/:chefId/verify
   * @access Protected - Admin only
   * @returns {Object} Verified chef profile data
   */
  async verifyChef(req, res, next) {
    try {
      const { chefId } = req.params;

      // Call service to verify chef
      const verifiedChef = await adminService.verifyChef(chefId, req.user._id);

      // Return success response with verified chef
      res.status(200).json({
        success: true,
        message: 'Chef verified successfully',
        data: verifiedChef
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Chef profile not found'
        });
      }
      if (error.message.includes('already verified')) {
        return res.status(400).json({
          success: false,
          message: 'Chef is already verified'
        });
      }
      next(error);
    }
  }

  /**
   * Reject a chef verification
   * @route PATCH /api/admin/chefs/:chefId/reject
   * @access Protected - Admin only
   * @body {string} reason - Reason for rejection
   * @returns {Object} Rejected chef profile data
   */
  async rejectChef(req, res, next) {
    try {
      const { chefId } = req.params;
      const { reason } = req.body;

      // Validate reason is provided
      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      // Call service to reject chef
      const rejectedChef = await adminService.rejectChef(chefId, req.user._id, reason);

      // Return success response with rejected chef
      res.status(200).json({
        success: true,
        message: 'Chef verification rejected successfully',
        data: rejectedChef
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Chef profile not found'
        });
      }
      if (error.message.includes('already rejected')) {
        return res.status(400).json({
          success: false,
          message: 'Chef verification is already rejected'
        });
      }
      if (error.message.includes('reason is required')) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      next(error);
    }
  }

  /**
   * Get paginated, filtered, and sorted categories
   * @route GET /api/admin/categories
   * @access Protected - Admin only
   * @query {number} page - Page number (default 1)
   * @query {number} limit - Records per page (default 20)
   * @query {string} search - Search term for category name
   * @query {string} sortBy - Field to sort by (name, createdAt)
   * @query {string} order - Sort order (asc, desc)
   * @returns {Object} Paginated categories with pagination metadata
   */
  async getCategories(req, res, next) {
    try {
      // Extract query parameters
      const {
        page = 1,
        limit = 20,
        search = '',
        sortBy = 'name',
        order = 'asc'
      } = req.query;

      // Call service to fetch paginated categories
      const result = await adminService.getCategories({
        page,
        limit,
        search,
        sortBy,
        order
      });

      // Return formatted response with categories and pagination
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category
   * @route POST /api/admin/categories
   * @access Protected - Admin only
   * @body {string} name - Category name (required)
   * @body {string} image - Optional image URL
   * @returns {Object} Created category data
   */
  async createCategory(req, res, next) {
    try {
      const { name, image } = req.body;

      // Validate name is provided
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Category name is required'
        });
      }

      // Call service to create category
      const category = await adminService.createCategory(name, image || '', req.user._id);

      // Return success response with created category
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('empty')) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty'
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Category already exists'
        });
      }
      next(error);
    }
  }

  /**
   * Update a category
   * @route PATCH /api/admin/categories/:categoryId
   * @access Protected - Admin only
   * @body {string} name - Category name (optional)
   * @body {string} image - Category image URL (optional)
   * @returns {Object} Updated category data
   */
  async updateCategory(req, res, next) {
    try {
      const { categoryId } = req.params;
      const { name, image } = req.body;

      // Validate at least one field is provided
      if (!name && !image) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name or image) must be provided'
        });
      }

      // Validate name is not empty if provided
      if (name && !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty'
        });
      }

      // Call service to update category
      const category = await adminService.updateCategory(categoryId, { name, image });

      // Return success response with updated category
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      if (error.message.includes('empty')) {
        return res.status(400).json({
          success: false,
          message: 'Category name cannot be empty'
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Category already exists'
        });
      }
      next(error);
    }
  }

  /**
   * Soft delete a category
   * @route DELETE /api/admin/categories/:categoryId
   * @access Protected - Admin only
   * @returns {Object} Deactivated category data
   */
  async deleteCategory(req, res, next) {
    try {
      const { categoryId } = req.params;

      // Call service to delete category
      const category = await adminService.deleteCategory(categoryId);

      // Return success response with deleted category
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: category
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      if (error.message.includes('Cannot deactivate')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Get paginated, filtered, and sorted bookings
   * @route GET /api/admin/bookings
   * @access Protected - Admin only
   * @query {number} page - Page number (default 1)
   * @query {number} limit - Records per page (default 20)
   * @query {string} search - Search term for client name/email or chef name
   * @query {string} status - Filter by booking status (pending, accepted, rejected, completed, cancelled)
   * @query {string} paymentStatus - Filter by payment status (pending, paid, failed, refunded)
   * @query {string} chefId - Filter by chef ID
   * @query {string} clientId - Filter by client ID
   * @query {string} dateFrom - Filter bookings from this date (ISO format)
   * @query {string} dateTo - Filter bookings until this date (ISO format)
   * @query {string} sortBy - Field to sort by (createdAt, bookingDate, status, paymentStatus)
   * @query {string} order - Sort order (asc, desc)
   * @returns {Object} Paginated bookings with pagination metadata
   */
  async getBookings(req, res, next) {
    try {
      // Extract query parameters
      const {
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
      } = req.query;

      // Call service to fetch paginated bookings
      const result = await adminService.getBookings({
        page,
        limit,
        search,
        status,
        paymentStatus,
        chefId,
        clientId,
        dateFrom,
        dateTo,
        sortBy,
        order
      });

      // Return formatted response with bookings and pagination
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single booking with all details
   * @route GET /api/admin/bookings/:bookingId
   * @access Protected - Admin only
   * @returns {Object} Detailed booking data with client, chef, menu, and transaction
   */
  async getBookingById(req, res, next) {
    try {
      const { bookingId } = req.params;

      // Call service to fetch booking details
      const booking = await adminService.getBookingById(bookingId);

      // Return formatted response with booking
      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      next(error);
    }
  }

  /**
   * Get paginated, filtered, and sorted transactions
   * @route GET /api/admin/payments
   * @access Protected - Admin only
   * @query {number} page - Page number (default 1)
   * @query {number} limit - Records per page (default 20)
   * @query {string} status - Filter by transaction status (pending, paid, failed, refunded)
   * @query {string} payoutStatus - Filter by payout status (pending, ready, paid)
   * @query {string} clientId - Filter by client ID
   * @query {string} chefId - Filter by chef ID
   * @query {string} startDate - Filter transactions from this date (ISO format)
   * @query {string} endDate - Filter transactions until this date (ISO format)
   * @query {string} search - Search term for transaction details
   * @query {string} sortBy - Field to sort by (createdAt, amount, status, commissionAmount, chefAmount, payoutStatus)
   * @query {string} order - Sort order (asc, desc)
   * @returns {Object} Paginated transactions with pagination metadata and payment summary
   */
  async getTransactions(req, res, next) {
    try {
      // Extract query parameters
      const {
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
      } = req.query;

      // Call service to fetch paginated transactions
      const result = await adminService.getTransactions({
        page,
        limit,
        status,
        payoutStatus,
        clientId,
        chefId,
        startDate,
        endDate,
        search,
        sortBy,
        order
      });

      // Return formatted response with transactions, pagination, and summary
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single transaction with all details
   * @route GET /api/admin/payments/:transactionId
   * @access Protected - Admin only
   * @returns {Object} Complete transaction data with related booking, client, and chef
   */
  async getTransactionById(req, res, next) {
    try {
      const { transactionId } = req.params;

      // Call service to fetch transaction details
      const transaction = await adminService.getTransactionById(transactionId);

      // Return formatted response with transaction
      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }
      next(error);
    }
  }
}

export default new AdminController();
