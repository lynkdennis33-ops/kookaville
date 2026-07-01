import express from 'express';
import userController from '../controllers/user.controller.js';
import auth from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = express.Router();

// All routes in this file are protected by auth middleware

// GET user profile
router.get('/profile', auth, userController.getProfile.bind(userController));

// PATCH update user profile
router.patch('/profile', auth, userController.updateProfile.bind(userController));

// PATCH update profile picture
// uploadAvatar runs before auth so multer parses the multipart body first,
// making req.file available by the time the controller executes.
router.patch(
  '/profile-picture',
  auth,
  uploadAvatar,
  userController.updateProfilePicture.bind(userController)
);

// PATCH change password
router.patch('/change-password', auth, userController.changePassword.bind(userController));

// DELETE deactivate account
router.delete('/profile', auth, userController.deactivateAccount.bind(userController));

export default router;
