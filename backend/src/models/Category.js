import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name must not exceed 50 characters'],
    },
    // WHY slug is useful:
    //   Slugs provide human-readable URLs and serve as SEO-friendly identifiers.
    //   Instead of /categories/507f1f77bcf86cd799439011, we can use /categories/fine-dining.
    //   Slugs are automatically generated from the category name and kept in sync.
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description must not exceed 300 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // WHY we store createdBy:
    //   Audit trail - tracks which admin created the category.
    //   Supports accountability and category history workflows.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
// WHY pre-save hook: Automatically generates slug whenever name is set or updated,
// keeping slug and name in sync without requiring manual API input.
categorySchema.pre('save', async function (next) {
  // Generate slug from name if name is modified or slug is missing
  if (this.isModified('name') || !this.slug) {
    // Convert name to slug: "Fine Dining" → "fine-dining"
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w-]/g, ''); // Remove special characters
  }

  // Check for case-insensitive duplicate names
  // WHY prevent duplicates: Duplicate names confuse users and admins.
  // Categories should have unique, identifiable names.
  if (this.isModified('name')) {
    const existingCategory = await mongoose.model('Category').findOne({
      name: new RegExp(`^${this.name}$`, 'i'),
      _id: { $ne: this._id }, // Exclude current document during update
    });

    if (existingCategory) {
      const error = new Error('Category already exists.');
      error.statusCode = 409;
      return next(error);
    }
  }

  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
