import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

// ─────────────────────────────────────────────────────────────────────────────
// Allowed MIME types and size limit
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// 5 MB expressed in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Multer configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WHY memoryStorage instead of diskStorage:
 *
 * Storing uploads on disk inside a containerised / serverless environment
 * (e.g. Railway, Render, AWS Lambda) is unreliable because the local
 * filesystem is ephemeral and may not persist between deploys or restarts.
 * Using memoryStorage keeps the file in a Buffer in RAM and lets us stream
 * it directly to Cloudinary without ever touching the disk, which is both
 * faster and more portable.
 */
const storage = multer.memoryStorage();

/**
 * Multer file filter — reject any MIME type that is not in the allow-list.
 * This runs before the file reaches the size check, giving a clear error
 * message for the wrong file type rather than a generic upload failure.
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are accepted.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

/**
 * Base Multer instance shared by both exported middleware helpers.
 * The limits object enforces the 5 MB ceiling on individual files.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exported Multer middleware
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware for a single file upload.
 * Expects the field name "image" in the multipart form.
 *
 * Usage:
 *   router.post('/upload', auth, uploadSingle, yourController.handler);
 */
export const uploadSingle = upload.single('image');

/**
 * Middleware for multiple file uploads (max 10).
 * Expects the field name "images" in the multipart form.
 *
 * Usage:
 *   router.post('/upload', auth, uploadMultiple, yourController.handler);
 */
export const uploadMultiple = upload.array('images', 10);

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary upload helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stream a file Buffer to Cloudinary and return its permanent URL and public ID.
 *
 * WHY we return both url AND publicId:
 *   Every image stored in MongoDB should keep its Cloudinary public_id alongside
 *   the secure URL.  When a user replaces an image (profile photo, menu cover,
 *   gallery shot, certificate), the old file can be deleted from Cloudinary
 *   using the public_id — preventing orphaned files and unnecessary storage costs.
 *   Without the public_id, deletion requires listing all assets or scraping the
 *   URL, which is fragile and slow.
 *
 * @param {Buffer} buffer  - File content as a Node.js Buffer (from req.file.buffer)
 * @param {string} folder  - Cloudinary folder path, e.g. "kookaville/profile"
 *
 * Supported folders (passed in by the caller — never hardcoded here):
 *   kookaville/profile
 *   kookaville/gallery
 *   kookaville/menu
 *   kookaville/certificates
 *
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    // upload_stream is the Cloudinary method that accepts a readable stream.
    // We convert the Buffer → ReadableStream using streamifier so we can pipe
    // it directly without writing a temporary file to disk.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        // Let Cloudinary auto-generate a unique public_id for each file.
        // This avoids collisions when multiple users upload images concurrently.
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error(
            `Cloudinary upload failed: ${error.message}`
          );
          uploadError.statusCode = 502;
          return reject(uploadError);
        }

        // Return only the fields every caller needs.
        // All MongoDB image objects should follow this shape:
        //   { url: "https://...", publicId: "kookaville/profile/abc123" }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    // Pipe the in-memory Buffer into the Cloudinary upload stream.
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
