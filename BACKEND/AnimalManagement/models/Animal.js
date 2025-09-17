import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnimalType', 
    required: true 
  },
  animalId: { type: String, required: true, unique: true },
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  qrCode: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  // Track zone assignment
  assignedZone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    default: null
  },
  // For batch animals, track if they're part of a batch
  batchId: {
    type: String,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Auto-update updatedAt
animalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better performance
animalSchema.index({ type: 1 });
animalSchema.index({ qrCode: 1 }, { unique: true, sparse: true });
animalSchema.index({ assignedZone: 1 }); // Index for zone queries
animalSchema.index({ batchId: 1 }); // Index for batch queries

export default mongoose.model('Animal', animalSchema);