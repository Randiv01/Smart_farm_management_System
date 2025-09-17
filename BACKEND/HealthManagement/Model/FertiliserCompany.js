// BACKEND/HealthManagement/Model/FertiliserCompany.js
import mongoose from "mongoose";

const fertiliserCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String }, // match React form
    email: { type: String },
    country: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("FertiliserCompany", fertiliserCompanySchema);
