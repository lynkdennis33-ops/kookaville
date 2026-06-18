import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validateSignup, validateLogin } from '../middleware/validate.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', validateSignup, authController.signup.bind(authController));
router.post('/login', validateLogin, authController.login.bind(authController));

// Protected route: Get currently authenticated user
router.get('/me', auth, authController.getCurrentUser.bind(authController));

export default router;
