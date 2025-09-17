// BACKEND/HealthManagement/Model/DoctorDetailsModel.js
import mongoose from "mongoose";

const DoctorDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phoneNo: { type: String, required: true, trim: true },
    licenseNumber: { type: String, trim: true },
    specializations: { type: String, trim: true },
    qualifications: { type: String, trim: true },
    yearsOfExperience: { type: Number },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    profilePhoto: { type: String }, // store path of uploaded file
    password: { type: String },
  },
  { timestamps: true }
);

const DoctorDetails = mongoose.model("DoctorDetails", DoctorDetailsSchema);
export default DoctorDetails;
