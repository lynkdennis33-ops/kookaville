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
}

export default new AdminController();
