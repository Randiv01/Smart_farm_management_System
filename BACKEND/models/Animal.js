import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AnimalType',
    required: true 
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
animalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Animal', animalSchema);