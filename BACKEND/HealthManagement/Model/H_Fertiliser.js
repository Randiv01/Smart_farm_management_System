// HealthManagement/Model/H_Fertiliser.js
import mongoose from "mongoose";

const fertiliserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // Organic / Chemical
    company: { type: String },
    currentStock: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g., kg, liter, g, gal, bag, l
    supplierName: { type: String },
    supplierContact: { type: String },
    email: { type: String },
    purchasePrice: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    storageLocation: { type: String },
    storageConditions: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Fertiliser", fertiliserSchema);