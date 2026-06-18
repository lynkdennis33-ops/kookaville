import authService from '../services/auth.service.js';

class AuthController {
  async signup(req, res, next) {
    try {
      const { firstName, lastName, email, password } = req.body;

      const result = await authService.registerUser({
        firstName,
        lastName,
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      error.statusCode = error.message === 'Email already registered' ? 400 : 500;
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      error.statusCode = 401;
      next(error);
    }
  }

  // Get currently authenticated user
  async getCurrentUser(req, res, next) {
    try {
      // User is already attached to req.user by auth middleware
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
