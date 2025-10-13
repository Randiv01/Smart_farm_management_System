import mongoose from "mongoose";

const plantPathologistSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phoneNo: { type: String },
    licenseNumber: { type: String, required: true },
    specializations: { type: [String], default: [] },
    qualifications: { type: String },
    yearsOfExperience: { type: Number, default: 0 },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    profilePhoto: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("PlantPathologist", plantPathologistSchema);

