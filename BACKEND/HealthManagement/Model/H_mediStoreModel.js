import mongoose from "mongoose";

const mediStoreSchema = new mongoose.Schema(
  {
    medicine_name: { type: String, required: true },
    animal_types: { type: String },
    disease_treated: { type: String },
    pharmacy_name: { type: String },
    expiry_date: { type: Date },
    quantity_available: { type: Number },
    unit: { type: String },
    price_per_unit: { type: Number },
    storage_location: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("H_MediStore", mediStoreSchema);