import api from "@/lib/api";

/**
 * Normalise a ChefProfile document (populated with user) returned by the
 * backend into the flat shape the frontend components expect.
 *
 * Mapping notes:
 *   - id          ← _id  (MongoDB ObjectId serialised as string)
 *   - name        ← user.firstName + user.lastName
 *   - avatar      ← user.avatar
 *   - reviews     ← totalReviews  (backend field name)
 *   - verified    ← verificationStatus === 'approved'
 *   - coverImage  ← gallery[0].url (first upload, or null)
 *   - gallery     ← gallery[].url  (URLs only, publicIds stripped)
 *   - location    ← serviceAreas[0] (first service area as display location)
 *   - dietary     ← [] (TODO: not yet implemented in backend)
 *   - featured    ← false (no dedicated flag in model; callers override when needed)
 *
 * @param {Object} chef  Raw ChefProfile from the API response
 * @returns {Object}     Normalised chef object
 */
function normalizeChef(chef) {
  const firstName = chef.user?.firstName ?? "";
  const lastName = chef.user?.lastName ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: chef._id,
    name,
    avatar: chef.user?.avatar || null,
    bio: chef.bio || "",
    rating: chef.rating ?? 0,
    reviews: chef.totalReviews ?? 0,
    verified: chef.verificationStatus === "approved",
    coverImage: chef.gallery?.[0]?.url || null,
    // Strip Cloudinary metadata — components only need the URL
    gallery: (chef.gallery ?? []).map((g) => g.url),
    specialties: chef.specialties ?? [],
    cuisines: chef.cuisines ?? [],
    serviceAreas: chef.serviceAreas ?? [],
    // Primary display location: first service area
    location: chef.serviceAreas?.[0] ?? "",
    pricePerPerson: chef.pricePerPerson ?? 0,
    yearsOfExperience: chef.yearsOfExperience ?? 0,
    availability: chef.availability ?? [],
    // Dietary capabilities declared on the chef profile
    dietary: chef.dietaryOptions ?? [],
    // No dedicated featured flag in model; override per endpoint as needed
    featured: false,
  };
}

/**
 * Fetch featured chefs for the homepage.
 * Backend returns the 6 most-recently-approved chefs.
 *
 * GET /api/chef/featured
 *
 * @returns {Promise<Array>} normalised chef objects
 */
export async function getFeaturedChefs() {
  const { data } = await api.get("/chef/featured");
  return data.data.chefs.map(normalizeChef);
}

/**
 * Search / filter approved chefs with pagination.
 *
 * GET /api/chef/search
 *
 * Supported filters (all optional):
 *   @param {string}  filters.keyword      - searches bio, specialties, cuisines
 *   @param {string}  filters.cuisine      - exact match against cuisines array
 *   @param {string}  filters.serviceArea  - exact match against serviceAreas array
 *   @param {string}  filters.dietary      - exact match against dietaryOptions array
 *   @param {number}  filters.minPrice     - minimum pricePerPerson
 *   @param {number}  filters.maxPrice     - maximum pricePerPerson
 *   @param {number}  filters.minRating    - minimum average rating (inclusive)
 *   @param {number}  filters.page         - page number (default: 1)
 *   @param {number}  filters.limit        - items per page (default: 10)
 *
 * @returns {Promise<{ chefs: Array, pagination: Object }>}
 */
export async function searchChefs(filters = {}) {
  // Strip empty / undefined values so the backend doesn't receive empty strings
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );
  const { data } = await api.get("/chef/search", { params });
  return {
    chefs: data.data.chefs.map(normalizeChef),
    pagination: data.data.pagination,
  };
}

/**
 * Fetch a single approved chef by their ChefProfile _id.
 *
 * GET /api/chef/:id
 *
 * @param {string} id  ChefProfile MongoDB _id
 * @returns {Promise<Object>} normalised chef object
 */
export async function getChefById(id) {
  const { data } = await api.get(`/chef/${id}`);
  return normalizeChef(data.data.chef);
}
