import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary client initialization.
 * Loaded once at startup and shared across the application.
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME  — your Cloudinary cloud name
 *   CLOUDINARY_API_KEY     — API key from the Cloudinary dashboard
 *   CLOUDINARY_API_SECRET  — API secret (keep this server-side only)
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
