import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnimalType', 
    required: true 
  },
  data: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  qrCode: { 
    type: String, 
    unique: true, 
    sparse: true 
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

export default mongoose.model('Animal', animalSchema);