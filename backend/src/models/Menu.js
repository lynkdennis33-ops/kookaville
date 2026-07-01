import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChefProfile',
      required: [true, 'Chef ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Menu name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Menu description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    // WHY publicId is stored alongside url:
    //   Cloudinary identifies and deletes assets by public_id, not by URL.
    //   Storing only the URL makes replacement impossible without parsing the
    //   URL string, which is fragile and couples the code to Cloudinary's URL
    //   format.  Storing both fields keeps deletion and replacement simple.
    image: {
      url: {
        type: String,
        default: '',
      },
      publicId: {
        type: String,
        default: '',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    servings: {
      type: Number,
      required: [true, 'Servings is required'],
      min: [1, 'Servings must be at least 1'],
    },
    ingredients: {
      type: [String],
      required: [true, 'Ingredients are required'],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Check for duplicate menu names per chef
menuSchema.pre('save', async function (next) {
  if (this.isModified('name')) {
    // Check for duplicate menu name for the same chef
    const existingMenu = await mongoose.model('Menu').findOne({
      chef: this.chef,
      name: this.name,
      _id: { $ne: this._id }, // Exclude current document during update
    });

    if (existingMenu) {
      const error = new Error('Menu already exists.');
      error.statusCode = 409;
      return next(error);
    }
  }
  next();
});

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
