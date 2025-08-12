import mongoose from "mongoose";

const animalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  healthStatus: { type: String, default: "Healthy" },
  type: { type: String, required: true } // "cows", "goats", etc.
}, { timestamps: true }); // Adds createdAt/updatedAt fields

export default mongoose.model("Animal", animalSchema);