// models/HarvestHistory.js
import mongoose from "mongoose";

const HarvestHistorySchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    index: true,
  },
  batchName: {
    type: String,
    required: true,
    trim: true,
  },
  animalType: {
    type: String,
    required: true,
    trim: true,
  },
  meatType: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unit: {
    type: String,
    enum: ["kg", "lbs"],
    default: "kg",
  },
  productionDate: {
    type: Date,
    required: true,
  },
  slaughterDate: {
    type: Date,
    required: true,
  },
  totalMeatProduced: {
    type: Number,
    required: true,
    min: 0.01,
  },
  storageLocation: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  harvestNotes: {
    type: String,
    trim: true,
  },
  statusAtHarvest: {
    type: String,
    enum: ["Fresh", "Stored", "Processed", "Sold", "Expired"],
  },
  healthConditionAtHarvest: {
    type: String,
    enum: ["Good", "Moderate", "Critical"],
  },
}, {
  timestamps: true,
});

export default mongoose.model("HarvestHistory", HarvestHistorySchema);