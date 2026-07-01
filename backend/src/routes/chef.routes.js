import express from 'express';
import chefController from '../controllers/chef.controller.js';
import auth from '../middleware/auth.js';
import authorize from '../middleware/roles.js';
import { uploadMultiple, uploadCertificate } from '../middleware/upload.js';

const router = express.Router();



// POST create chef profile
// Protected route - requires authentication
// Clients can apply to become a chef
router.post('/profile', auth, chefController.createProfile.bind(chefController));

// GET user's chef profile
router.get('/profile', auth, chefController.getProfile.bind(chefController));

// PATCH update chef profile
router.patch('/profile', auth, chefController.updateProfile.bind(chefController));

// ── Gallery ──────────────────────────────────────────────────────────────────

// POST upload one or more gallery images
// Protected — chef role only
// Field name: "images" (multipart/form-data), max 10 files per request
router.post(
  '/gallery',
  auth,
  authorize('chef'),
  uploadMultiple,
  chefController.addGalleryImages.bind(chefController)
);

// DELETE remove one gallery image by its MongoDB _id
// Protected — chef role only
// :imageId is the MongoDB _id of the gallery subdocument, NOT the Cloudinary publicId
router.delete(
  '/gallery/:imageId',
  auth,
  authorize('chef'),
  chefController.deleteGalleryImage.bind(chefController)
);

// ── Certificates ────────────────────────────────────────────────────────────

// POST upload a certificate
// Protected — chef role only
// Field name: "certificate" (multipart/form-data, single file)
// Body: { title, issuer?, issueDate?, expiryDate? }
router.post(
  '/certificates',
  auth,
  authorize('chef'),
  uploadCertificate,
  chefController.uploadCertificate.bind(chefController)
);

// GET all certificates for the authenticated chef
// Protected — chef role only
router.get(
  '/certificates',
  auth,
  authorize('chef'),
  chefController.getCertificates.bind(chefController)
);

// DELETE one certificate
// Protected — chef role only
// :certificateId is the MongoDB _id of the certificate subdocument
router.delete(
  '/certificates/:certificateId',
  auth,
  authorize('chef'),
  chefController.deleteCertificate.bind(chefController)
);

// ─────────────────────────────────────────────────────────────────────────────




// GET all approved chefs with pagination and sorting - Public route
// Query: ?page=1&limit=10&sort=newest
router.get('/', chefController.getChefs.bind(chefController));

// GET search and filter chefs - Public route (must come before /:id)
// Query parameters: keyword, cuisine, serviceArea, minPrice, maxPrice
router.get('/search', chefController.searchChefs.bind(chefController));

// GET featured chefs - Public route (must come before /:id)
router.get('/featured', chefController.getFeaturedChefs.bind(chefController));

// GET specific chef by ID - Public route
// :id refers to ChefProfile _id
router.get('/:id', chefController.getChef.bind(chefController));

// PATCH update chef verification status - Admin only
// :id refers to ChefProfile _id
// Body: { status: 'approved' | 'rejected' | 'pending' }
router.patch('/:id/verification', auth, authorize('admin'), chefController.updateVerificationStatus.bind(chefController));


export default router;
