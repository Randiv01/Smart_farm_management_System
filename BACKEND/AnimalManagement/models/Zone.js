import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema({
  zoneID: { type: String, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ["Shelter", "Cage", "Pond", "Open Field", "Barn", "Shelter + Pond"], required: true },
  dimensions: {
    length: Number,
    width: Number,
    unit: { type: String, enum: ["m", "km", "ft"], default: "m" },
  },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  environment: {
    temperature: Number,
    humidity: Number,
    waterDepth: Number,
  },
  assignedAnimalTypes: [{ type: String }],
  assignedBatch: [{ type: String }],
}, { timestamps: true });

export default mongoose.model("Zone", zoneSchema);
