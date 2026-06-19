import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [50, 'Category name must not exceed 50 characters'],
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
  },
  {
    timestamps: true,
  }
);

// Ensure case-insensitive unique constraint on name
categorySchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    // Check for case-insensitive duplicate
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
