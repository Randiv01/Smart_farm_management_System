import mongoose from 'mongoose';

const plantSchema = new mongoose.Schema({
  plantName: { type: String, required: true },
  category: { type: String, required: true },
  greenhouseId: { type: String, required: true },
  length: Number,
  width: Number,
  location: String,
  plantedDate: Date,
  expectedHarvest: Date,
  estimatedYield: Number,
  status: String,
  imageUrl: String
}, { timestamps: true });

// Register the model
export default mongoose.model('Plant', plantSchema);
