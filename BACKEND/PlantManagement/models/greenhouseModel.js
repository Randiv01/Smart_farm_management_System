import mongoose from 'mongoose';

const GreenhouseSchema = new mongoose.Schema({
  greenhouseName: { type: String, required: true },
  location: { type: String, required: true },
  temperature: { type: Number },
  humidity: { type: Number },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Maintenance'], 
    default: 'Active' 
  },
}, { timestamps: true });

export default mongoose.model('greenhouse', GreenhouseSchema);
