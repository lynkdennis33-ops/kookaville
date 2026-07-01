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
    // WHY gallery items have their own MongoDB _id:
    //   Each subdocument in a Mongoose array is automatically assigned an _id.
    //   The DELETE endpoint identifies which image to remove using this _id, not
    //   the Cloudinary publicId.  Using MongoDB _id keeps routing simple and
    //   avoids exposing Cloudinary internals in the API.
    //
    // WHY publicId is stored:
    //   Cloudinary requires the public_id to delete an asset.  Storing only the
    //   URL makes deletion impossible without parsing the URL string, which is
    //   fragile.  Storing publicId alongside url makes replacement and deletion
    //   straightforward regardless of how the URL changes.
    //
    // WHY uploadedAt is stored:
    //   Timestamps enable future features such as sorting the gallery by upload
    //   date, auditing when images were added, and enforcing retention policies.
    //
    // WHY the gallery has a maximum size:
    //   Unbounded arrays grow the document indefinitely.  MongoDB has a 16 MB
    //   per-document limit and large arrays degrade query performance.  A cap of
    //   20 images is generous for a chef portfolio while keeping documents lean.
    gallery: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    availability: [
      {
        day: String,
        startTime: String,
        endTime: String,
      },
    ],
    // WHY certificates store metadata:
    //   Certificates are not just files — they're credentials that must pass
    //   verification before a chef can list them on their profile.  Metadata
    //   (title, issuer, dates) allows filtering, sorting, and decision-making
    //   during the verification workflow, which will be implemented later.
    //
    // WHY publicId is stored in the file object:
    //   Cloudinary requires the public_id to delete assets.  Storing only the
    //   URL makes deletion impossible without parsing the URL, which is fragile.
    //
    // WHY certificates default to pending:
    //   New uploads must be reviewed by admin before appearing on the public
    //   profile.  Defaulting to 'pending' ensures chefs cannot immediately
    //   claim unverified credentials.
    //
    // WHY uploadedAt is stored:
    //   Timestamps enable sorting, auditing, and future retention policies.
    certificates: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        issuer: {
          type: String,
          trim: true,
          default: '',
        },
        issueDate: Date,
        expiryDate: Date,
        file: {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
        verificationStatus: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    // WHY verification audit fields:
    //   The platform must maintain a complete audit trail of administrative actions.
    //   Recording which admin verified a chef, when, and with what notes enables
    //   accountability, allows review of verification decisions, and supports
    //   appeals or reversals.  These fields enable a complete verification workflow.
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    verificationNotes: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

// Index for faster queries by user ID
chefProfileSchema.index({ user: 1 });

const ChefProfile = mongoose.model('ChefProfile', chefProfileSchema);

export default ChefProfile;
