import mongoose from "mongoose";

const healthSpecialistSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phoneNo: {
      type: String,
      trim: true,
    },
    medicalLicenseNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    specializations: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: String,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, "Years of experience cannot be negative"],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    profilePhoto: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HealthSpecialist", healthSpecialistSchema);
