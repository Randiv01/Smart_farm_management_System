import mongoose from "mongoose";

const refillRequestSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnimalFood',
    required: true
  },
  foodName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  requestedBy: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: String
  },
  notes: {
    type: String
  }
});

const RefillRequest = mongoose.model('RefillRequest', refillRequestSchema);

export default RefillRequest;