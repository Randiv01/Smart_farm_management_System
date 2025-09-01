import mongoose from 'mongoose';

const productivitySchema = new mongoose.Schema({
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: false
  },
  batchId: {
    type: String,
    default: null
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  productType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  recordedBy: {
    type: String,
    default: 'System'
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

// Indexes for better performance
productivitySchema.index({ animalId: 1, date: 1 });
productivitySchema.index({ batchId: 1, date: 1 });
productivitySchema.index({ isGroup: 1 });
productivitySchema.index({ productType: 1 });

// Auto-update updatedAt
productivitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Productivity', productivitySchema);