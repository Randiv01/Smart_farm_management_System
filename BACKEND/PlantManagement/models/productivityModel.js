// BACKEND/PlantManagement/models/productivityModel.js
import mongoose from 'mongoose';

const productivitySchema = new mongoose.Schema({
  plantType: { type: String, required: true },
  greenhouseNo: { type: String, required: true },
  harvestDate: { type: Date, required: true },
  quantity: { type: Number, required: true },
  qualityGrade: { type: String, enum: ['A', 'B', 'C'], required: true },
  worker: { type: String, required: true }
}, { timestamps: true });

const Productivity = mongoose.model('productivity', productivitySchema);
export default Productivity;
