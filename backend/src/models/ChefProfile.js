import mongoose from 'mongoose';

const chefProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    bio: {
      type: String,
      required: [true, 'Bio is required'],
      trim: true,
      maxlength: [1000, 'Bio must not exceed 1000 characters'],
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative'],
    },
    specialties: {
      type: [String],
      required: [true, 'Specialties are required'],
    },
    cuisines: {
      type: [String],
      default: [],
    },
    serviceAreas: {
      type: [String],
      required: [true, 'Service areas are required'],
    },
    pricePerPerson: {
      type: Number,
      required: [true, 'Price per person is required'],
      min: [0, 'Price per person cannot be negative'],
    },
    gallery: {
      type: [String],
      default: [],
    },
    availability: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index for faster queries by user ID
chefProfileSchema.index({ user: 1 });

const ChefProfile = mongoose.model('ChefProfile', chefProfileSchema);

export default ChefProfile;
