import mongoose from 'mongoose';

const GreenhouseSchema = new mongoose.Schema({
  greenhouseName: { type: String, required: true },
  location: { type: String, required: true },
  temperature: { type: Number },
  humidity: { type: Number },
}, { timestamps: true });

export default mongoose.model('greenhouse', GreenhouseSchema);
