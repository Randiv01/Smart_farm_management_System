// models/Productivity.js
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
  }, // COMMA ADDED HERE
  productType: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 0
  },
  // Note: Productivity fields will be dynamic based on animal type
}, { strict: false }); // Allow dynamic fields

// Indexes for better performance
productivitySchema.index({ animalId: 1, date: 1 });
productivitySchema.index({ batchId: 1, date: 1 });
productivitySchema.index({ isGroup: 1 });
productivitySchema.index({ date: 1 });

// Auto-update updatedAt
productivitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AnimalProductivity', productivitySchema);