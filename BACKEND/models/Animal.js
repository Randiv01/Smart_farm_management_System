import mongoose from "mongoose";

const vaccinationRecordSchema = new mongoose.Schema({
  vaccineName: String,
  dateGiven: Date,
}, { _id: false });

const animalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // e.g. cows, goats
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ["Male", "Female", "Unknown"], default: "Unknown" },
  healthStatus: { type: String, default: "Healthy" },
  weight: Number, // kg or lbs
  owner: String,
  location: String,
  vaccinationRecords: [vaccinationRecordSchema],
  lastCheckup: Date,
  reproductiveStatus: String, // e.g. Pregnant, In heat, Not bred
  milkProduction: Number, // daily liters or gallons
  feedType: String,
  notes: String,
  qrCode: { type: String, unique: true }, // <-- NEW field

}, { timestamps: true });

export default mongoose.model("Animal", animalSchema);
