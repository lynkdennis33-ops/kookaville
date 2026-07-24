import mongoose from 'mongoose';

const savedChefSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
    },
    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChefProfile',
      required: [true, 'Chef ID is required'],
    },
  },
  { timestamps: true },
);

// Compound unique index — a client cannot save the same chef more than once.
// MongoDB will raise an E11000 duplicate key error on the second insert, which
// the service layer catches and converts to a 409 response.
savedChefSchema.index({ client: 1, chef: 1 }, { unique: true });

const SavedChef = mongoose.model('SavedChef', savedChefSchema);

export default SavedChef;
