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

/**
 * GET /api/admin/chefs/pending
 * Retrieve paginated pending chef applications
 * @access Protected - Admin role only
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Records per page (default 20)
 * @query {string} search - Search term for firstName, lastName, or email
 * @query {string} sortBy - Field to sort by (createdAt, yearsOfExperience)
 * @query {string} order - Sort order (asc, desc)
 * @returns {Object} Paginated pending chefs with pagination metadata
 */
router.get('/chefs/pending', auth, authorize('admin'), adminController.getPendingChefs.bind(adminController));

/**
 * PATCH /api/admin/chefs/:chefId/verify
 * Verify a chef account
 * @access Protected - Admin role only
 * @returns {Object} Verified chef profile data
 */
router.patch('/chefs/:chefId/verify', auth, authorize('admin'), adminController.verifyChef.bind(adminController));

/**
 * PATCH /api/admin/chefs/:chefId/reject
 * Reject a chef verification
 * @access Protected - Admin role only
 * @body {string} reason - Reason for rejection
 * @returns {Object} Rejected chef profile data
 */
router.patch('/chefs/:chefId/reject', auth, authorize('admin'), adminController.rejectChef.bind(adminController));

/**
 * GET /api/admin/categories
 * Retrieve paginated, filtered, and sorted categories
 * @access Protected - Admin role only
 * @query {number} page - Page number (default 1)
 * @query {number} limit - Records per page (default 20)
 * @query {string} search - Search term for category name
 * @query {string} sortBy - Field to sort by (name, createdAt)
 * @query {string} order - Sort order (asc, desc)
 * @returns {Object} Paginated categories with menuCount
 */
router.get('/categories', auth, authorize('admin'), adminController.getCategories.bind(adminController));

/**
 * POST /api/admin/categories
 * Create a new category
 * @access Protected - Admin role only
 * @body {string} name - Category name (required)
 * @body {string} image - Optional image URL
 * @returns {Object} Created category data
 */
router.post('/categories', auth, authorize('admin'), adminController.createCategory.bind(adminController));

/**
 * PATCH /api/admin/categories/:categoryId
 * Update a category
 * @access Protected - Admin role only
 * @body {string} name - Category name (optional)
 * @body {string} image - Category image URL (optional)
 * @returns {Object} Updated category data
 */
router.patch('/categories/:categoryId', auth, authorize('admin'), adminController.updateCategory.bind(adminController));

/**
 * DELETE /api/admin/categories/:categoryId
 * Soft delete a category
 * @access Protected - Admin role only
 * @returns {Object} Deactivated category data
 */
router.delete('/categories/:categoryId', auth, authorize('admin'), adminController.deleteCategory.bind(adminController));

/**
 * GET /api/admin/bookings
 * Retrieve paginated, filtered, and sorted bookings
 * @access Protected - Admin role only
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
router.get('/bookings', auth, authorize('admin'), adminController.getBookings.bind(adminController));

/**
 * GET /api/admin/bookings/:bookingId
 * Retrieve detailed booking information
 * @access Protected - Admin role only
 * @returns {Object} Booking with client, chef, menu, and transaction details
 */
router.get('/bookings/:bookingId', auth, authorize('admin'), adminController.getBookingById.bind(adminController));

/**
 * GET /api/admin/payments
 * Retrieve paginated, filtered, and sorted transactions
 * @access Protected - Admin role only
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
router.get('/payments', auth, authorize('admin'), adminController.getTransactions.bind(adminController));

/**
 * GET /api/admin/payments/:transactionId
 * Retrieve detailed transaction information
 * @access Protected - Admin role only
 * @returns {Object} Transaction with booking, client, and chef details
 */
router.get('/payments/:transactionId', auth, authorize('admin'), adminController.getTransactionById.bind(adminController));

export default router;
