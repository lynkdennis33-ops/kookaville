import { Router } from 'express';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';
import adminController from '../controllers/admin.controller.js';

const router = Router();

/**
 * Admin Routes
 * All routes protected with auth and admin role authorization
 */

/**
 * GET /api/admin/dashboard
 * Retrieve admin dashboard statistics
 * @access Protected - Admin role only
 * @returns {Object} Dashboard statistics including users, chefs, bookings, payments, revenue, and recent activity
 */
router.get('/dashboard', auth, authorize('admin'), adminController.getDashboard.bind(adminController));

/**
 * GET /api/admin/users
 * Retrieve paginated, filtered, and sorted users
 * @access Protected - Admin role only
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Records per page (default 20)
 * @query {string} search - Search term for firstName, lastName, or email
 * @query {string} role - Filter by role (client, chef, admin)
 * @query {string} status - Filter by status (active, suspended)
 * @query {string} sortBy - Field to sort by (createdAt, firstName, lastName, email)
 * @query {string} order - Sort order (asc, desc)
 * @returns {Object} Paginated users with pagination metadata
 */
router.get('/users', auth, authorize('admin'), adminController.getUsers.bind(adminController));

/**
 * PATCH /api/admin/users/:userId/suspend
 * Suspend a user account
 * @access Protected - Admin role only
 * @body {string} reason - Reason for suspension
 * @returns {Object} Suspended user data
 */
router.patch('/users/:userId/suspend', auth, authorize('admin'), adminController.suspendUser.bind(adminController));

/**
 * PATCH /api/admin/users/:userId/unsuspend
 * Unsuspend a user account
 * @access Protected - Admin role only
 * @returns {Object} Unsuspended user data
 */
router.patch('/users/:userId/unsuspend', auth, authorize('admin'), adminController.unsuspendUser.bind(adminController));

export default router;
