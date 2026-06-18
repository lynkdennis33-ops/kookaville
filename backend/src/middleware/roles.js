/**
 * Role-based authorization middleware
 * Checks if user has required role(s)
 * Usage: authorize('admin') or authorize('client', 'chef')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is attached to request (should be from auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.',
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action.',
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authorize;
