import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Fertilizer', 'Animal Food', 'Both']
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  products: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
supplierSchema.index({ name: 1, company: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ rating: -1 });

// Static method to get suppliers by type
supplierSchema.statics.getByType = function(type) {
  return this.find({ type, isActive: true }).sort({ rating: -1, name: 1 });
};

// Static method to get top rated suppliers
supplierSchema.statics.getTopRated = function(limit = 5) {
  return this.find({ isActive: true, rating: { $gte: 4 } })
    .sort({ rating: -1, name: 1 })
    .limit(limit);
};

// Method to update rating
supplierSchema.methods.updateRating = function(newRating) {
  this.rating = newRating;
  return this.save();
};

const Supplier = mongoose.model('Supplier', supplierSchema);
export default Supplier;